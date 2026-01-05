const Navbar = ({
  onOpenFile,
  savetranslateJson,
  onOpenFolder,
  onToggleSidebar,
  sidebarVisible,
}: {
  onOpenFile: () => void | Promise<void>,
  savetranslateJson: () => void | Promise<void>,
  onOpenFolder: () => void | Promise<void>,
  onToggleSidebar: () => void,
  sidebarVisible: boolean,
}) => {
  return (
    <div className="w-full h-10 px-2 shadow flex justify-between items-center fixed top-0 bg-white z-50">
      <div className="flex items-center gap-4">
        <h1 className="tracking-tight text-slate-800">iM@S2 EDITOR</h1>
      </div>

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