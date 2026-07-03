import {type ChangeEvent, type DragEvent, useRef, useState} from 'react'
import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {ArrayOfObjectsInputProps, set, useClient} from 'sanity'

const createKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function GalleryDropzoneInput(props: ArrayOfObjectsInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [uploadProgress, setUploadProgress] = useState({uploaded: 0, total: 0})

  const client = useClient({apiVersion: '2024-01-01'})

  const appendImages = async (files: File[]) => {
    const acceptedImages = files.filter((file) => file.type.startsWith('image/'))
    const rejectedFiles = files.filter((file) => !file.type.startsWith('image/'))

    if (rejectedFiles.length > 0) {
      setStatusMessage('Sono consentite solo immagini. I video non sono supportati in questo caricamento.')
    } else {
      setStatusMessage('')
    }

    if (!acceptedImages.length) return

    setIsUploading(true)
    setUploadProgress({uploaded: 0, total: acceptedImages.length})

    try {
      const uploadedImageAssets = await Promise.all(
        acceptedImages.map(async (file) => {
          const asset = await client.assets.upload('image', file, {
            filename: file.name,
          })

          setUploadProgress((prev) => ({
            ...prev,
            uploaded: prev.uploaded + 1,
          }))

          return {
            _type: 'imageAsset',
            _key: createKey(),
            file: {
              _type: 'image',
              asset: {
                _type: 'reference',
                _ref: asset._id,
              },
            },
          }
        })
      )

      const nextValue = [...(props.value || []), ...uploadedImageAssets]
      props.onChange(set(nextValue))
      setStatusMessage(`Caricate ${uploadedImageAssets.length} immagini.`)
    } catch (error) {
      console.error(error)
      setStatusMessage('Caricamento non riuscito. Riprova.')
    } finally {
      setIsUploading(false)
      setUploadProgress({uploaded: 0, total: 0})
    }
  }

  const onFilesSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    await appendImages(files)
    event.target.value = ''
  }

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    const files = Array.from(event.dataTransfer.files || [])
    if (!files.length) return
    await appendImages(files)
  }

  return (
    <Stack space={4}>
      <Card
        padding={4}
        radius={2}
        border
        tone={isDragging ? 'primary' : 'default'}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDrop={onDrop}
      >
        <Stack space={3}>
          <Text size={1}>Trascina immagini qui per caricarle in blocco.</Text>
          <Flex gap={2} align="center">
            <Button
              mode="ghost"
              text={isUploading ? 'Caricamento in corso...' : 'Seleziona immagini'}
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            />
            {isUploading ? (
              <Text size={1}>
                {uploadProgress.uploaded} / {uploadProgress.total} caricate
              </Text>
            ) : null}
            {statusMessage ? <Text size={1}>{statusMessage}</Text> : null}
          </Flex>
        </Stack>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onFilesSelected}
      />

      {props.renderDefault(props)}
    </Stack>
  )
}
