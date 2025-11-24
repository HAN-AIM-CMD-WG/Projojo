export default function PdfPreview({ url, className = "" }) {
    return (
        <iframe
            src={`${url}#view=FitV`}
            type="application/pdf"
            className={`w-full h-[40rem] ${className}`}
            allow="fullscreen"
            title="PDF Preview"
        />
    )
}