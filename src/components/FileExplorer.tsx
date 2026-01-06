import { useState, useCallback, memo, useEffect, useRef } from 'react'
import useSWR from 'swr'
import useLocalStorage from '../hooks/useLocalStorage'

export interface FileNode {
  name: string;
  kind: 'file' | 'directory';
  handle: FileSystemFileHandle | FileSystemDirectoryHandle;
  children?: FileNode[];
  path: string;
}

interface FileExplorerProps {
  directoryHandle: FileSystemDirectoryHandle | null;
  currentFilePath: string | null;
  onSelectFile: (handle: FileSystemFileHandle, path: string) => void;
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  currentFilePath: string | null;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onSelectFile: (handle: FileSystemFileHandle, path: string) => void;
}

const FileTreeItem = memo(({
  node,
  depth,
  currentFilePath,
  expandedPaths,
  onToggleExpand,
  onSelectFile
}: FileTreeItemProps) => {
  const isExpanded = expandedPaths.has(node.path)
  const isSelected = currentFilePath === node.path
  const isDirectory = node.kind === 'directory'
  const isJsonFile = node.kind === 'file' && node.name.endsWith('.json')

  if (node.kind === 'file' && !isJsonFile) {
    return null
  }

  const handleClick = () => {
    if (isDirectory) {
      onToggleExpand(node.path)
    } else if (node.kind === 'file') {
      onSelectFile(node.handle as FileSystemFileHandle, node.path)
    }
  }

  return (
    <div>
      <div
        className={`file-tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={handleClick}
        data-selected={isSelected}
        title={node.path}
      >
        {isDirectory ? (
          <span className={`folder-indicator ${isExpanded ? 'expanded' : ''}`}>
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M3 2L7 5L3 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        ) : (
          <span className="file-spacer" />
        )}
        <span className="file-name text-nowrap truncate">{node.name}</span>
      </div>
      {isDirectory && isExpanded && node.children && (
        <div className="file-tree-children">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              currentFilePath={currentFilePath}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  )
})

FileTreeItem.displayName = 'FileTreeItem'

const FileExplorer = ({
  directoryHandle,
  currentFilePath,
  onSelectFile
}: FileExplorerProps) => {
  const [expandedPathsArray, setExpandedPathsArray] = useState<string[] | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useLocalStorage('expandedPaths', expandedPathsArray, setExpandedPathsArray)

  const expandedPaths = new Set(expandedPathsArray || [])

  const lastFilePathRef = useRef<string | null>(null)

  useEffect(() => {
    if (currentFilePath && currentFilePath !== lastFilePathRef.current && expandedPathsArray !== null) {
      lastFilePathRef.current = currentFilePath
      const parts = currentFilePath.split('/')
      const newPaths = [...(expandedPathsArray || [])]
      let changed = false

      let current = ''
      for (let i = 0; i < parts.length - 1; i++) {
        current = current ? `${current}/${parts[i]}` : parts[i]
        if (!newPaths.includes(current)) {
          newPaths.push(current)
          changed = true
        }
      }

      if (changed) {
        setExpandedPathsArray(newPaths)
      }
    }
  }, [currentFilePath, expandedPathsArray])

  const readDirectory = async (
    dirHandle: FileSystemDirectoryHandle,
    parentPath: string = ''
  ): Promise<FileNode[]> => {
    const nodes: FileNode[] = []

    for await (const entry of dirHandle.values()) {
      const path = parentPath ? `${parentPath}/${entry.name}` : entry.name

      if (entry.kind === 'directory') {
        const children = await readDirectory(entry as FileSystemDirectoryHandle, path)
        const hasJsonFiles = children.some(
          child => child.kind === 'file' || (child.kind === 'directory' && child.children && child.children.length > 0)
        )
        if (hasJsonFiles) {
          nodes.push({
            name: entry.name,
            kind: 'directory',
            handle: entry as FileSystemDirectoryHandle,
            children,
            path
          })
        }
      } else if (entry.name.endsWith('.json')) {
        nodes.push({
          name: entry.name,
          kind: 'file',
          handle: entry as FileSystemFileHandle,
          path
        })
      }
    }

    nodes.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === 'directory' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    return nodes
  }

  const fetcher = async (handle: FileSystemDirectoryHandle) => {
    const permission = await handle.queryPermission()
    if (permission !== 'granted') {
      setPermissionDenied(true)
      return []
    }
    setPermissionDenied(false)
    return readDirectory(handle, '')
  }

  const { data: fileTree, isLoading, mutate } = useSWR(
    directoryHandle ? ['fileTree', directoryHandle.name] : null,
    () => fetcher(directoryHandle!),
    {
      revalidateOnFocus: true,
      revalidateIfStale: false,
    }
  )

  useEffect(() => {
    if (!isLoading && currentFilePath) {
      requestAnimationFrame(() => {
        const selectedElement = document.querySelector('[data-selected="true"]')
        if (selectedElement) {
          selectedElement.scrollIntoView({
            block: 'nearest',
            behavior: 'auto'
          })
        }
      })
    }
  }, [isLoading, currentFilePath, fileTree])

  const handleRequestPermission = async () => {
    if (directoryHandle) {
      try {
        const permission = await directoryHandle.requestPermission()
        if (permission === 'granted') {
          setPermissionDenied(false)
          mutate()
        }
      } catch (error) {
        console.error('Request permission failed:', error)
      }
    }
  }

  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPathsArray(prev => {
      const currentArr = prev || []
      if (currentArr.includes(path)) {
        return currentArr.filter(p => p !== path)
      } else {
        return [...currentArr, path]
      }
    })
  }, [])

  if (!directoryHandle) {
    return (
      <div className="file-explorer-empty">
        <p>请点击"打开文件夹"选择一个目录</p>
      </div>
    )
  }

  if (permissionDenied) {
    return (
      <div className="file-explorer-permission p-4 text-center">
        <p className="text-sm text-gray-500 mb-4">需要重新授权以访问目录：<br /><span className="font-mono">{directoryHandle.name}</span></p>
        <button onClick={handleRequestPermission}>
          点击授权
        </button>
      </div>
    )
  }

  const nodes = fileTree || []

  return (
    <div className="file-explorer h-full flex flex-col">
      <div className="file-explorer-header flex items-center justify-between p-2 border-b">
        <span className="folder-name truncate font-bold text-sm text-slate-600" title={directoryHandle.name}>
          {directoryHandle.name}
        </span>
        <div className="flex gap-2 animate-fadeIn">
          <button
            onClick={() => mutate()}
            title="刷新文件列表"
            disabled={isLoading}
          >
            {isLoading ? '正在刷新' : '刷新'}
          </button>
        </div>
      </div>

      <div className="file-tree flex-1 overflow-auto custom-scrollbar pt-1">
        {nodes.map((node) => (
          <FileTreeItem
            key={node.path}
            node={node}
            depth={0}
            currentFilePath={currentFilePath}
            expandedPaths={expandedPaths}
            onToggleExpand={handleToggleExpand}
            onSelectFile={onSelectFile}
          />
        ))}
        {nodes.length === 0 && !isLoading && (
          <div className="file-tree-empty p-4 text-center text-gray-400">
            <p className="text-sm">没有找到 JSON 文件</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileExplorer
