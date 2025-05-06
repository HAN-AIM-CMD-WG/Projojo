export default function InfoBox({ children, className }) {
    return (
        <div className={`px-4 py-2.5 w-full bg-[#f9fafc] border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 ${className}`}>
            {children}
        </div>
    );
}