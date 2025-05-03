import Loading from "./Loading";

/**
 * Creates a Card component
 */
export default function Card({ children, header, className, isLoading = false, showHeader = true }) {
    return (
        <div className="flex min-h-full flex-col justify-center">
            <div className="mx-auto max-w-2xl w-full">
                <div className={`bg-white mt-6 shadow min-h-[50px] ${className}`}>
                    {showHeader && <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">{header}</h2>}
                    {!isLoading ? children :
                        <Loading size="3rem" />
                    }
                </div>
            </div>
        </div>
    );
}