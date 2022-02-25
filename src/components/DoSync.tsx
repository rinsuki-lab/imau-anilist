import { Anchor, Button, Center, Progress, Space, Text } from "@mantine/core"
import { useState } from "react"
import { ANNICT_TO_MAL_STATUS_MAP, MALAPI } from "../mal"
import { AnimeWork } from "../types"

export const DoSync = ({
  checks,
  works,
  malAccessToken,
}: {
  checks: number[]
  works: Map<number, AnimeWork>
  malAccessToken: string
}) => {
  const [isStarted, setIsStarted] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const success = (successCount / checks.length) * 100
  const failed = (failedCount / checks.length) * 100
  const [failedWorks, setFailedWorks] = useState<AnimeWork[]>([])
  const [processing, setProcessing] = useState<AnimeWork | null>(null)
  const mal = new MALAPI(malAccessToken)
  return (
    <>
      <Center>
        <Button
          color={checks.length === 0 || isStarted ? "gray" : "primary"}
          onClick={async () => {
            if (isStarted) {
              return
            }
            setSuccessCount(0)
            setFailedCount(0)
            setFailedWorks([])
            setIsStarted(true)
            for (const annictId of checks) {
              const work = works.get(annictId)
              if (!work) {
                continue
              }
              if (!work.malId) {
                setSuccessCount((i) => i + 1)
                continue
              }
              setProcessing(work)
              try {
                await mal.updateAnimeStatus({
                  id: work.malId,
                  status: ANNICT_TO_MAL_STATUS_MAP[work.status],
                  num_watched_episodes: work.noEpisodes
                    ? 1
                    : work.watchedEpisodeCount,
                })
                await new Promise<void>((res) => {
                  setTimeout(() => res(), 500)
                })
                setSuccessCount((i) => i + 1)
              } catch (error) {
                console.error(error)
                setFailedWorks((works) => [...works, work])
                setFailedCount((i) => i + 1)
                await new Promise<void>((res) => {
                  setTimeout(() => res(), 500)
                })
              }
            }
            setProcessing(null)
            setIsStarted(false)
          }}
        >
          Sync
        </Button>
      </Center>
      <Space h="md" />
      {isStarted && (
        <Progress
          size="xl"
          sections={[
            { value: success, color: "blue" },
            { value: failed, color: "red" },
          ]}
          animate
          striped
        ></Progress>
      )}
      {processing && (
        <>
          <Space h="sm" />
          <Center>{processing.title}</Center>
        </>
      )}
      {!processing && 0 < failedWorks.length && (
        <>
          <Space h="sm" />
          {failedWorks.map((work) => (
            <Anchor
              key={work.annictId}
              href={`https://myanimelist.net/anime/${work.malId}`}
            >
              <Text>{work.title}</Text>
            </Anchor>
          ))}
        </>
      )}
    </>
  )
}
