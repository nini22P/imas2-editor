import type { Dialog, Xmb } from '../App'

const Navbar = ({
  fileName,
  data,
  onOpenFile,
  savetranslateJson,
  onOpenFolder,
  onToggleSidebar,
  sidebarVisible,
  isDirty
}: {
  fileName: string | null,
  data: Dialog | Xmb | null,
  onOpenFile: () => void | Promise<void>,
  savetranslateJson: () => void | Promise<void>,
  onOpenFolder: () => void | Promise<void>,
  onToggleSidebar: () => void,
  sidebarVisible: boolean,
  isDirty?: boolean
}) => {
  const internalFilename = (data as Dialog)?.filename

  return (
    <div className="w-full h-10 px-2 shadow flex justify-between items-center fixed top-0 bg-white z-50">
      <div className="flex items-center gap-4">
        <h1 className="tracking-tight text-slate-800">iM@S2 EDITOR</h1>
      </div>

      <p className="text-gray-600 text-sm font-medium truncate max-w-2xl px-2">
        {isDirty && <span className="text-amber-500 mr-1" title="有未保存的更改">●</span>}
        {fileName || '未选择文件'}
        {internalFilename && <span className="text-slate-300 mx-2">|</span>}
        {internalFilename && <span className="text-slate-400 font-normal">{internalFilename}</span>}
      </p>

      <div className="flex gap-2">
        <button onClick={onOpenFile}>打开文件</button>
        <button onClick={onOpenFolder}>打开文件夹</button>
        <button onClick={savetranslateJson}>保存</button>
        <button onClick={onToggleSidebar}>
          {sidebarVisible ? '关闭侧栏' : '打开侧栏'}
        </button>
      </div>
    </div>
  )
}

export default Navbar