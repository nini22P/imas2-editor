import { useState, useEffect, useRef, useCallback } from 'react'
import _ from 'lodash'
import useLocalStorage from './hooks/useLocalStorage'
import Navbar from './components/Navbar'
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

export default function App() {

  const [fileName, setFileName] = useState<string | null>(null)
  const [type, setType] = useState<Type | null>(null)
  const [data, setData] = useState<Dialog | Xmb | null>(null)

  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [currentFileHandle, setCurrentFileHandle] = useState<FileSystemFileHandle | null>(null)
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null)
  const [sidebarVisible, setSidebarVisible] = useState<boolean | null>(false)
  const [isDirty, setIsDirty] = useState(false)
  const lastSavedDataRef = useRef<string>('')
  const mainRef = useRef<HTMLDivElement>(null)

  const [enableCharacterCheck, setEnableCharacterCheck] = useState<boolean | null>(false)

  useLocalStorage('fileName', fileName, setFileName)
  useLocalStorage('type', type, setType)
  useLocalStorage('data', data, setData)
  useLocalStorage('sidebarVisible', sidebarVisible, setSidebarVisible)
  useLocalStorage('directoryHandle', directoryHandle, setDirectoryHandle, { useIndexedDB: true })
  useLocalStorage('currentFileHandle', currentFileHandle, setCurrentFileHandle, { useIndexedDB: true })
  useLocalStorage('currentFilePath', currentFilePath, setCurrentFilePath)
  useLocalStorage('enableCharacterCheck', enableCharacterCheck, setEnableCharacterCheck)

  useEffect(() => {
    if (data) {
      const currentDataStr = JSON.stringify(data)
      setIsDirty(currentDataStr !== lastSavedDataRef.current)
    } else {
      setIsDirty(false)
    }
  }, [data])

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [currentFilePath])

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


  const processJsonData = (jsonString: string) => {
    try {
      const data: Dialog | Xmb = JSON.parse(jsonString)
      console.log('读取 JSON 数据:', data)
      if ('filename' in data && data.filename && 'strings' in data && data.strings) {
        setType('dialog')
        if (data.translate === undefined) {
          data.translate = data.strings
        }
        setData(data)
      } else if (Array.isArray(data) && data.length > 0 && '_offset' in data[0]) {
        setType('xmb')
        data.forEach((item: XmbItem) => {
          if (item.translate === undefined) {
            item.translate = item._text
          }
        })
        setData(_.uniqBy(data, '_offset'))
      }
    } catch (e) {
      console.error('Process JSON failed:', e)
    }
  }

  const setInitialData = (jsonString: string) => {
    lastSavedDataRef.current = JSON.stringify(JSON.parse(jsonString))
    processJsonData(jsonString)
    setIsDirty(false)
  }

  const checkUnsavedChanges = useCallback(() => {
    if (isDirty) {
      return window.confirm('当前文件有未保存的修改，切换文件将丢失这些修改。确定要继续吗？')
    }
    return true
  }, [isDirty])

  const handleOpenFolder = async () => {
    if (!checkUnsavedChanges()) return
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
    if (!checkUnsavedChanges()) return
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
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
        multiple: false
      })

      if (!handle) return

      const file = await handle.getFile()
      const content = await file.text()

      let relativePath = file.name
      if (directoryHandle) {
        try {
          const pathParts = await directoryHandle.resolve(handle)
          if (pathParts) {
            relativePath = pathParts.join('/')
          }
        } catch (e) {
          console.error('Resolve path failed:', e)
        }
      }

      setFileName(file.name)
      setCurrentFileHandle(handle)
      setCurrentFilePath(relativePath)
      setInitialData(content)
    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      console.error('打开文件失败:', error)
    }
  }

  const handleSelectFile = async (handle: FileSystemFileHandle, path: string) => {
    if (!checkUnsavedChanges()) return
    try {
      if (!await verifyPermission(handle)) {
        return
      }
      const file = await handle.getFile()
      const content = await file.text()
      setFileName(file.name)
      setCurrentFileHandle(handle)
      setCurrentFilePath(path)
      setInitialData(content)
    } catch (error) {
      console.error('读取文件失败:', error)
    }
  }

  const savetranslateJson = async () => {
    if (fileName && data && type) {
      let saveData = data

      if (type === 'xmb') {
        saveData = (data as Xmb).filter(item => item.translate !== null)
      }

      const jsonString = JSON.stringify(saveData, null, 2).replace(/\n/g, '\r\n')

      const buffer = new ArrayBuffer(2 + jsonString.length * 2)
      const bufferView = new Uint16Array(buffer)
      bufferView[0] = 0xFEFF // BOM
      for (let i = 0; i < jsonString.length; i++) {
        bufferView[i + 1] = jsonString.charCodeAt(i)
      }

      if (currentFileHandle) {
        try {
          if (!await verifyPermission(currentFileHandle, true)) {
            downloadFile(bufferView)
            return
          }
          const writable = await currentFileHandle.createWritable()
          await writable.write(bufferView.buffer as ArrayBuffer)
          await writable.close()

          lastSavedDataRef.current = JSON.stringify(saveData)
          setIsDirty(false)

          const displayPath = directoryHandle && currentFilePath ? `${directoryHandle.name}/${currentFilePath}` : fileName
          alert(`已覆盖本地文件: ${displayPath}`)
        } catch (error) {
          console.error('文件保存失败:', error)
          downloadFile(bufferView)
        }
      } else {
        downloadFile(bufferView)
      }
    }
  }

  const downloadFile = (bufferView: Uint16Array) => {
    const blob = new Blob([bufferView.buffer as ArrayBuffer], { type: 'application/json;charset=utf-16le' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const fullDisplayPath = (directoryHandle && currentFilePath) ? `${directoryHandle.name}/${currentFilePath}` : fileName

  return (
    <div className="flex flex-col h-screen">
      <Navbar
        fileName={fullDisplayPath}
        data={data}
        isDirty={isDirty}
        onOpenFile={handleOpenFile}
        savetranslateJson={savetranslateJson}
        onOpenFolder={handleOpenFolder}
        onToggleSidebar={() => setSidebarVisible(!sidebarVisible)}
        sidebarVisible={!!sidebarVisible}
      />
      <div className="flex flex-1 overflow-hidden pt-10">
        <main ref={mainRef} className={`flex-1 overflow-auto ${!sidebarVisible ? 'w-full' : ''}`}>
          {
            data ? (
              <div className="pt-2 pb-8">
                {
                  type === 'dialog' &&
                  <DialogEditor
                    key={currentFilePath || 'dialog'}
                    data={data as Dialog}
                    enableCharacterCheck={enableCharacterCheck || false}
                    setData={setData as React.Dispatch<React.SetStateAction<Dialog>>}
                  />
                }
                {
                  type === 'xmb' &&
                  <XmbEditor
                    key={currentFilePath || 'xmb'}
                    data={data as Xmb}
                    enableCharacterCheck={enableCharacterCheck || false}
                    setData={setData as React.Dispatch<React.SetStateAction<Xmb>>}
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
            currentFilePath={currentFilePath}
            onSelectFile={handleSelectFile}
          />
        </Sidebar>
      </div>
    </div>
  )
}
