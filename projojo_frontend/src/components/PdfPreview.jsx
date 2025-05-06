export default function PdfPreview({ link }) {
    return (
        <div className="bg-gray-200 p-3 rounded-lg">
            <h2 className="text-lg ms-1 mb-2 font-semibold">CV</h2>
            <embed src={link} type="application/pdf" width="100%" height="600px" />
        </div>
    )
}