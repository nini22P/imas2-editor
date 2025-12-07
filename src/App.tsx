import { useState } from "react";
import _ from "lodash";
import useLocalStorage from "./hooks/useLocalStorage";
import Navbar from "./components/Navbar";
import DialogEditor from "./components/DialogEditor";
import XmbEditor from "./components/XmbEditor";

export type Type = "dialog" | "xmb";

export interface Dialog {
  filename: string;
  strings: string[];
  translate: string[];
};

export interface XmbItem {
  "_offset": number;
  "_offsetHex": string;
  "_text": string;
  "_size": number;
  translate: string | null;
};

export type Xmb = XmbItem[]

export default function App() {

  const [fileName, setFileName] = useState<string | null>(null);
  const [type, setType] = useState<Type | null>(null);
  const [data, setData] = useState<Dialog | Xmb | null>(null);

  useLocalStorage('fileName', fileName, setFileName);
  useLocalStorage('type', type, setType);
  useLocalStorage('data', data, setData);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
      readJsonFile(file);
    }
  };

  const readJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result;
        if (fileContent) {
          const data: Dialog | Xmb = JSON.parse(fileContent as string);
          console.log('读取 JSON 文件:', data);
          if ("filename" in data && data.filename && "strings" in data && data.strings) {
            setType("dialog");
            if (data.translate === undefined) {
              data.translate = data.strings;
            }
            setData(data);
          } else if (Array.isArray(data) && "_offset" in data[0]) {
            setType("xmb");
            data.forEach((item: XmbItem) => {
              if (item.translate === undefined) {
                item.translate = item._text;
              }
            });
            setData(_.uniqBy(data, "_offset"));
          }
        }
      } catch (error) {
        console.error('JSON 解析错误:', error);
      }
    };
    reader.readAsText(file);
  };

  const savetranslateJson = () => {
    if (fileName && data && type) {
      let saveData = data;

      if (type === 'xmb') {
        saveData = (data as Xmb).filter(item => item.translate !== null)
      }

      const jsonString = JSON.stringify(saveData, null, 2);

      const blob = new Blob([jsonString], { type: 'application/json' });

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();

      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <Navbar
        fileName={fileName}
        data={data}
        handleFileChange={handleFileChange}
        savetranslateJson={savetranslateJson}
      />
      {
        data &&
        <main className="py-12">
          {
            type === "dialog"
            &&
            <DialogEditor
              data={data as Dialog}
              setData={setData}
            />
          }
          {
            type === "xmb"
            &&
            <XmbEditor
              data={data as Xmb}
              setData={setData}
            />
          }
        </main>
      }

    </div>
  );
}
