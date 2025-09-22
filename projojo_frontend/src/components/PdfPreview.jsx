export default function PdfPreview({ link }) {
    return (
        
            <embed src={link} type="application/pdf" width="100%" height="600px" />
    )
}