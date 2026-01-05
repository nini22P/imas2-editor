const PageChanger = ({ totalPages, currentPage, handlePageChange }: { totalPages: number, currentPage: number, handlePageChange: (page: number) => void }) => {
  if (totalPages === 1) {
    return null
  }
  return (
    <div className='fixed bottom-0 p-2 m-auto transition-all duration-75' style={{ width: 'calc(100% - var(--sidebar-width, 0px))', left: 0 }}>
      <div className='w-fit m-auto p-1 rounded bg-[#f0f0f0cc] shadow flex flex-wrap gap-1 backdrop-blur-lg'>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => {
              handlePageChange(index + 1)
              document.querySelector('main')?.scrollTo(0, 0)
            }}
            style={{
              backgroundColor: currentPage === index + 1 ? 'lightblue' : 'white',
            }}
          >
            {index + 1}
          </button>
        ))}

      </div>
    </div>
  )
}

export default PageChanger