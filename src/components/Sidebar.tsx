import { useState, useRef, useEffect, useCallback } from 'react'

interface SidebarProps {
    visible: boolean;
    children: React.ReactNode;
}

const Sidebar = ({ visible, children }: SidebarProps) => {
    const [width, setWidth] = useState(() => {
        const saved = localStorage.getItem('sidebarWidth')
        return saved ? parseInt(saved, 10) : 280
    })

    useEffect(() => {
        document.documentElement.style.setProperty('--sidebar-width', visible ? `${width + 4}px` : '0px')
    }, [width, visible])
    const [isDragging, setIsDragging] = useState(false)
    const sidebarRef = useRef<HTMLDivElement>(null)

    const MIN_WIDTH = 180
    const MAX_WIDTH = 600

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return
            const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX))
            setWidth(newWidth)
        }

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false)
                localStorage.setItem('sidebarWidth', width.toString())
            }
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isDragging, width])

    if (!visible) {
        return null
    }

    return (
        <div
            ref={sidebarRef}
            className="sidebar border-l border-gray-200"
            style={{ width: `${width}px` }}
        >
            <div
                className="sidebar-resizer-left"
                onMouseDown={handleMouseDown}
            />
            <div className="sidebar-content">
                {children}
            </div>
        </div>
    )
}

export default Sidebar
