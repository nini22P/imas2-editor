import { useState, useEffect, useRef } from 'react'
import _ from 'lodash'
import useSWR, { mutate } from 'swr'
import useLocalStorage from './hooks/useLocalStorage'
import Navbar from './components/Navbar'
import FileTabs from './components/FileTabs'
import DialogEditor from './components/DialogEditor'
import XmbEditor from './components/XmbEditor'
import Sidebar from './components/Sidebar'
import FileExplorer from './components/FileExplorer'

export type Type = 'dialog' | 'xmb';

export interface Dialog {
  filename: string;
  strings: string[];
  translate: string[];
}

export interface XmbItem {
  '_offset': number;
  '_offsetHex': string;
  '_text': string;
  '_size': number;
  translate: string | null;
}

export type Xmb = XmbItem[];

export interface OpenedFile {
  path: string;
  handle: FileSystemFileHandle;
  data: Dialog | Xmb;
  type: Type;
  lastSavedData: string;
  fileName: string;
}

const parseJsonData = (jsonString: string): { data: Dialog | Xmb, type: Type } | null => {
  try {
    const data: Dialog | Xmb = JSON.parse(jsonString)
    if ('filename' in data && data.filename && 'strings' in data && data.strings) {
      if (data.translate === undefined) {
        data.translate = data.strings
      }
      return { data, type: 'dialog' }
    } else if (Array.isArray(data) && data.length > 0 && '_offset' in data[0]) {
      data.forEach((item: XmbItem) => {
        if (item.translate === undefined) {
          item.translate = item._text
        }
      })
      return { data: _.uniqBy(data, '_offset'), type: 'xmb' }
    }
  } catch (e) {
    console.error('Process JSON failed:', e)
  }
  return null
}

export default function App() {

  const [openedFiles, setOpenedFiles] = useState<OpenedFile[]>([])
  const [activeFileIndex, setActiveFileIndex] = useState<number>(-1)

  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState<boolean | null>(false)
  const mainRef = useRef<HTMLDivElement>(null)

  const [enableCharacterCheck, setEnableCharacterCheck] = useState<boolean | null>(false)

  const openedFilesRef = useRef(openedFiles)
  useEffect(() => { openedFilesRef.current = openedFiles }, [openedFiles])

  useLocalStorage('openedFiles', openedFiles, setOpenedFiles as unknown as React.Dispatch<React.SetStateAction<OpenedFile[] | null>>, { useIndexedDB: true })
  useLocalStorage('activeFileIndex', activeFileIndex, setActiveFileIndex as unknown as React.Dispatch<React.SetStateAction<number | null>>)
  useLocalStorage('sidebarVisible', sidebarVisible, setSidebarVisible)
  useLocalStorage('directoryHandle', directoryHandle, setDirectoryHandle, { useIndexedDB: true })
  useLocalStorage('enableCharacterCheck', enableCharacterCheck, setEnableCharacterCheck)

  const activeFile = (activeFileIndex >= 0 && (openedFiles?.length ?? 0) > 0) ? openedFiles[activeFileIndex] : null

  const fileFetcher = async ([path]: [string]) => {
    const file = openedFilesRef.current.find(f => f.path === path)
    if (!file) throw new Error('File not found')

    if ((await file.handle.queryPermission({ mode: 'read' })) !== 'granted') {
      return null
    }

    const fileDisk = await file.handle.getFile()
    const content = await fileDisk.text()
    return parseJsonData(content)
  }

  useSWR(
    activeFile ? [activeFile.path] : null,
    fileFetcher,
    {
      onSuccess: (data) => {
        if (!data) return

        const currentFiles = openedFilesRef.current
        const currentIndex = activeFileIndex
        const currentFile = currentFiles[currentIndex]

        if (!currentFile || currentFile.path !== activeFile?.path) return

        const diskDataStr = JSON.stringify(data.data)

        if (diskDataStr !== currentFile.lastSavedData) {
          const isUserDirty = JSON.stringify(currentFile.data) !== currentFile.lastSavedData

          if (!isUserDirty) {
            const updatedFiles = [...currentFiles]
            updatedFiles[currentIndex] = {
              ...currentFile,
              data: data.data,
              lastSavedData: diskDataStr
            }
            setOpenedFiles(updatedFiles)
            console.log(`[AutoSync] 已自动同步 ${currentFile.fileName} 到最新版本`)
          } else {
            console.warn(`[AutoSync] 检测到 ${currentFile.fileName} 外部更新，但用户有未保存修改，跳过自动同步。`)
          }
        }
      }
    }
  )

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [activeFile?.path])

  const verifyPermission = async (handle: FileSystemHandle, readWrite: boolean = false) => {
    const options: { mode?: 'read' | 'readwrite' } = {}
    if (readWrite) {
      options.mode = 'readwrite'
    }

    try {
      if ((await handle.queryPermission(options)) === 'granted') {
        return true
      }

      if ((await handle.requestPermission(options)) === 'granted') {
        return true
      }
    } catch (e) {
      console.error('Permission check failed:', e)
    }

    return false
  }

  const handleOpenFileContent = async (handle: FileSystemFileHandle, path: string) => {
    const safeOpenedFiles = openedFiles || []

    const existingIndex = safeOpenedFiles.findIndex(f => f.path === path)
    if (existingIndex >= 0) {
      setActiveFileIndex(existingIndex)
      return
    }

    try {
      if (!await verifyPermission(handle)) return
      const file = await handle.getFile()
      const content = await file.text()
      const parsed = parseJsonData(content)

      if (parsed) {
        const newFile: OpenedFile = {
          path,
          handle,
          data: parsed.data,
          type: parsed.type,
          lastSavedData: JSON.stringify(parsed.data),
          fileName: file.name
        }
        const newList = [...safeOpenedFiles, newFile]
        setOpenedFiles(newList)
        setActiveFileIndex(newList.length - 1)
      }
    } catch (error) {
      console.error('打开文件失败:', error)
    }
  }

  const handleCloseFile = (index: number) => {
    const fileToClose = openedFiles[index]
    const isDirty = JSON.stringify(fileToClose.data) !== fileToClose.lastSavedData

    if (isDirty) {
      if (!window.confirm(`文件 ${fileToClose.fileName} 有未保存的修改，确定要关闭吗？`)) {
        return
      }
    }

    const newOpenedFiles = openedFiles.filter((_, i) => i !== index)
    setOpenedFiles(newOpenedFiles)

    if (activeFileIndex === index) {
      setActiveFileIndex(newOpenedFiles.length > 0 ? Math.max(0, index - 1) : -1)
    } else if (activeFileIndex > index) {
      setActiveFileIndex(activeFileIndex - 1)
    }
  }

  const handleTabChange = (index: number) => {
    setActiveFileIndex(index)
  }

  const handleOpenFolder = async () => {
    try {
      const picker = (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker
      const handle = await picker()
      setDirectoryHandle(handle)
      setSidebarVisible(true)
    } catch (error) {
      console.error('打开目录失败:', error)
    }
  }

  const handleOpenFile = async () => {
    try {
      const picker = (window as unknown as {
        showOpenFilePicker: (options?: {
          types?: Array<{
            description?: string;
            accept: Record<string, string[]>;
          }>;
          multiple?: boolean;
        }) => Promise<FileSystemFileHandle[]>
      }).showOpenFilePicker

      const [handle] = await picker({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        multiple: false
      })

      if (!handle) return

      let relativePath = handle.name
      if (directoryHandle) {
        try {
          const pathParts = await directoryHandle.resolve(handle)
          if (pathParts) relativePath = pathParts.join('/')
        } catch (e) { console.error('Resolve path failed:', e) }
      }

      await handleOpenFileContent(handle, relativePath)
    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      console.error('打开文件失败:', error)
    }
  }

  const handleSelectFile = async (handle: FileSystemFileHandle, path: string) => {
    await handleOpenFileContent(handle, path)
  }

  const savetranslateJson = async () => {
    if (activeFile) {
      let saveData = activeFile.data

      if (activeFile.type === 'xmb') {
        saveData = (activeFile.data as Xmb).filter(item => item.translate !== null)
      }

      const jsonString = JSON.stringify(saveData, null, 2).replace(/\n/g, '\r\n')
      const buffer = new ArrayBuffer(2 + jsonString.length * 2)
      const bufferView = new Uint16Array(buffer)
      bufferView[0] = 0xFEFF // BOM
      for (let i = 0; i < jsonString.length; i++) {
        bufferView[i + 1] = jsonString.charCodeAt(i)
      }

      try {
        let canDirectSave = false
        if (directoryHandle) {
          try {
            const path = await directoryHandle.resolve(activeFile.handle)
            if (path) canDirectSave = true
          } catch {
            console.warn('File not in current directory tree, falling back to download.')
          }
        }

        if (!canDirectSave || !await verifyPermission(activeFile.handle, true)) {
          downloadFile(bufferView, activeFile.fileName)
          return
        }

        const fileOnDisk = await activeFile.handle.getFile()
        const contentOnDisk = await fileOnDisk.text()
        const parsedOnDisk = parseJsonData(contentOnDisk)

        if (parsedOnDisk && JSON.stringify(parsedOnDisk.data) !== activeFile.lastSavedData) {
          const confirmOverwrite = window.confirm(
            `警告：文件 ${activeFile.fileName} 已在外部被修改！\n\n` +
            '磁盘上的内容与您上次打开/保存时的版本不一致。\n' +
            '如果继续保存，将覆盖外部的更改。\n\n' +
            '确定要覆盖吗？'
          )
          if (!confirmOverwrite) return
        }

        const writable = await activeFile.handle.createWritable()
        await writable.write(bufferView.buffer as ArrayBuffer)
        await writable.close()

        mutate([activeFile.path], { data: activeFile.data, type: activeFile.type }, false)

        const updatedFiles = [...openedFiles]
        updatedFiles[activeFileIndex] = {
          ...activeFile,
          lastSavedData: JSON.stringify(activeFile.data)
        }
        setOpenedFiles(updatedFiles)

        alert(`已保存: ${activeFile.path}`)
      } catch (error) {
        console.error('文件保存失败:', error)
        downloadFile(bufferView, activeFile.fileName)
      }
    }
  }

  const downloadFile = (bufferView: Uint16Array, name: string) => {
    const blob = new Blob([bufferView.buffer as ArrayBuffer], { type: 'application/json;charset=utf-16le' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }

  const updateActiveFileData = (newDataOrUpdater: Dialog | Xmb | ((prev: Dialog | Xmb) => Dialog | Xmb)) => {
    if (activeFileIndex >= 0) {
      setOpenedFiles(prev => prev.map((f, i) => {
        if (i === activeFileIndex) {
          const newData = typeof newDataOrUpdater === 'function'
            ? (newDataOrUpdater as (prev: Dialog | Xmb) => Dialog | Xmb)(f.data)
            : newDataOrUpdater
          return { ...f, data: newData }
        }
        return f
      }))
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <Navbar
        onOpenFile={handleOpenFile}
        savetranslateJson={savetranslateJson}
        onOpenFolder={handleOpenFolder}
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        sidebarVisible={!!sidebarVisible}
      />
      <FileTabs
        openedFiles={openedFiles}
        activeFileIndex={activeFileIndex}
        onTabChange={handleTabChange}
        onCloseFile={handleCloseFile}
      />
      <div className="flex flex-1 overflow-hidden pt-[72px]">
        <main ref={mainRef} className={`flex-1 overflow-auto ${!sidebarVisible ? 'w-full' : ''}`}>
          {
            activeFile ? (
              <div className="pt-2 pb-8">
                {
                  activeFile.type === 'dialog' &&
                  <DialogEditor
                    key={activeFile.path || 'dialog'}
                    data={activeFile.data as Dialog}
                    enableCharacterCheck={enableCharacterCheck || false}
                    setData={updateActiveFileData as React.Dispatch<React.SetStateAction<Dialog>>}
                  />
                }
                {
                  activeFile.type === 'xmb' &&
                  <XmbEditor
                    key={activeFile.path || 'xmb'}
                    data={activeFile.data as Xmb}
                    enableCharacterCheck={enableCharacterCheck || false}
                    setData={updateActiveFileData as React.Dispatch<React.SetStateAction<Xmb>>}
                  />
                }
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p className="text-xl text-center px-4">请打开一个 JSON 文件或整个翻译文件夹开始工作</p>
                <div className="mt-4 flex gap-4">
                  <button onClick={handleOpenFile}>
                    📝 打开文件
                  </button>
                  <button onClick={handleOpenFolder}>
                    📂 打开文件夹
                  </button>
                </div>
              </div>
            )
          }
        </main>

        <Sidebar visible={!!sidebarVisible}>
          <FileExplorer
            directoryHandle={directoryHandle}
            currentFilePath={activeFile?.path || null}
            onSelectFile={handleSelectFile}
          />
        </Sidebar>
      </div>
    </div>
  )
}
