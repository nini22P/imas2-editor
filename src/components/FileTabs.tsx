import { useEffect, useMemo, useRef } from 'react'
import type { OpenedFile } from '../App'

interface FileTabsProps {
  openedFiles: OpenedFile[];
  activeFileIndex: number;
  onTabChange: (index: number) => void;
  onCloseFile: (index: number) => void;
}

const FileTabs = ({ openedFiles, activeFileIndex, onTabChange, onCloseFile }: FileTabsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeFile = useMemo(() => openedFiles[activeFileIndex], [activeFileIndex, openedFiles])

  useEffect(() => {
    if (!activeFile) return
    const id = `file-tab-${activeFile.path}`
    document.getElementById(id)?.scrollIntoView({
      block: 'nearest',
      behavior: 'auto'
    })
  }, [activeFile])

  if (!openedFiles || openedFiles.length === 0) return null

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY
    }
  }

  return (
    <div
      ref={scrollRef}
      onWheel={handleWheel}
      className="flex items-center select-none overflow-x-auto fixed top-10 left-0 right-0 z-40 h-8 backdrop-blur-md bg-opacity-80"
      style={{
        backgroundColor: 'rgba(248, 250, 252, 0.8)',
        borderBottom: '1px solid var(--border-color)'
      }}
    >
      {openedFiles.map((file, index) => {
        const isDirty = JSON.stringify(file.data) !== file.lastSavedData
        const isActive = activeFileIndex === index

        const handleAuxClick = (e: React.MouseEvent) => {
          if (e.button === 1) {
            e.preventDefault()
            onCloseFile(index)
          }
        }

        return (
          <div
            id={`file-tab-${file.path}`}
            key={file.path}
            className={'group flex items-center gap-1 p-1 pl-2 h-full text-[13px] cursor-pointer transition-all duration-150 relative border-r'}
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: isActive ? 'var(--tab-bg-active)' : 'transparent',
              color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
            }}
            onClick={() => onTabChange(index)}
            onMouseDown={handleAuxClick}
          >
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-indigo-500" style={{ backgroundColor: 'var(--accent-primary)' }} />
            )}
            {isDirty && (
              <span className="w-1 h-1 rounded-full shadow-sm" style={{ backgroundColor: 'var(--accent-primary)' }} />
            )}
            <span className="truncate max-w-48" title={file.path}>
              {file.fileName}
            </span>
            <button
              title='关闭'
              className={`
                          !text-[16px] ml-1 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center p-0 w-5 h-5 !shadow-none
                          hover:!shadow
                          ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                        `}
              onClick={(e) => {
                e.stopPropagation()
                onCloseFile(index)
              }}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default FileTabs
