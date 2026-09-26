    interface Buttonprops{
        children:string,
        onClick :()=>void
    }
export function Button({children, onClick}:Buttonprops){

    return (
        <button
        onClick={onClick}
        className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-700 transition-colors duration-150 active:scale-[0.98]"
        >
            
        clickme
        </button>
    )
}