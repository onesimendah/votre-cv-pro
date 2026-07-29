import { pdf, DocumentProps } from '@react-pdf/renderer'
import { ReactElement } from 'react'

export async function exportPdfDocument(doc: ReactElement<DocumentProps>, fileName: string) {
  const pdfInstance = pdf(doc)
  const blob = await pdfInstance.toBlob()
  const url = URL.createObjectURL(blob)
  const link = createDownloadLink(url, fileName)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const createDownloadLink = (url: string, fileName: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.style.display = 'none'
  document.body.appendChild(link)
  return link
}
