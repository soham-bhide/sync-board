    interface Buttonprops{
        children:string,
        onClick :()=>void
    }
export function Button({children, onClick}:Buttonprops){

    return (
        <button
        onClick={onClick}
        className="px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none text-sm font-medium border-none cursor-pointer shadow-sm hover:shadow-md"
        >
            
        {children}
        </button>
    )
}