import { useRef } from "react";
import type { Dialog, Xmb } from "../App";

const Navbar = ({ fileName, data, handleFileChange, savetranslateJson }
  : {
    fileName: string | null,
    data: Dialog | Xmb | null,
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
    savetranslateJson: () => void,
  }) => {

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const filename = (data as Dialog)?.filename;

  return (
    <div className="w-full h-12 px-4 shadow flex justify-between items-center fixed top-0 bg-white">
      <h1>iM@S2 EDITOR</h1>
      <p className="text-gray-600 text-sm text-center">
        {fileName}
        {filename && <span className="text-black"> / </span>}
        {filename && `${filename}`}
      </p>
      <div className="flex gap-2">
        <input accept=".json" type="file" title="打开文件" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
        <button onClick={handleOpenClick}>打开</button>
        <button onClick={savetranslateJson}>保存</button>
      </div>
    </div>
  )
}

export default Navbar