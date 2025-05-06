import React, { Children, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Creates a PagedComponent component
 */
export default function PagedComponent({ children, nextButtonText = "Volgende", finishButtonText = "Beëindigen", previousButtonText = "Vorige", nextButtonClass = "btn-secondary", finishButtonClass = "btn-primary", previousButtonClass = "btn-secondary", onNext = () => { } }) {
    const [page, setPage] = useState(0);
    const navigate = useNavigate();

    if (Children.count(children) !== 0 && children.type?.toString() === "Symbol(react.fragment)") {
        children = children.props.children; // story book fix
    }

    if (page <= 0) {
        previousButtonText = "Annuleren";
    }

    const count = Children.count(children);
    const lastPage = page + 1 >= count;

    if (count === 0) {
        return <div>Geen pagina&apos;s</div>;
    }

    function onNextClick(event) {
        const nextPage = page + 1;

        let dontChange = false;
        const pageChangedEvent = { preventDefault: () => dontChange = true };
        onNext(nextPage, pageChangedEvent);
        if (dontChange) {
            return;
        }

        if (nextPage < count) {
            setPage(nextPage);
        }

        if (event.target.type === "button") {
            event.preventDefault();
        }
    }

    function onPreviousClick(event) {
        if (page > 0) {
            setPage(page - 1);
        } else if (page <= 0) {
            navigate(-1);
        }

        event.preventDefault();
    }

    const chilrenWithProps = Children.map(children, (child, index) => {
        return React.cloneElement(child, { hidden: page !== index });
    });

    return (
        <>
            <section className="mb-4" data-testid="paged_component">
                {chilrenWithProps}
            </section>
            <div className="flex flex-row justify-between" data-testid="page-buttons">
                <button onClick={onPreviousClick} className={previousButtonClass} type="button">{previousButtonText}</button>
                <button onClick={onNextClick} className={lastPage ? finishButtonClass : nextButtonClass} type={lastPage ? "submit" : "button"}>{lastPage ? finishButtonText : nextButtonText}</button>
            </div>
        </>
    );
}