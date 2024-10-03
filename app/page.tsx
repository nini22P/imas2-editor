"use client";

import DialogEditor from "@/components/DialogEditor";
import MailEditor from "@/components/MailEditor";
import Navbar from "@/components/Navbar";
import XmbEditor from "@/components/XmbEditor";
import { useState } from "react";
import _ from "lodash";

export type JsonType = "dialog" | "mail" | "xmb";

export interface DialogJson {
  filename: string;
  strings: string[];
};

export interface MailItem {
  "@id": string;
  "subject": {
    "@id": string;
    "text_node": {
      "@_text": string;
    };
  },
  "body": {
    "@id": string;
    "text_node": {
      "@_text": string;
    };
  },
  "atc": {
    "@id": string;
    "text_node": {
      "@_text": string;
    };
  }
}

export interface MailJson {
  root: {
    mail: MailItem[];
  }
}

export interface XmbItem {
  "_offset": number;
  "_offsetHex": string;
  "_text": string;
  "_size": number;
};

export type XmbJson = XmbItem[]

export default function Home() {

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonType, setJsonType] = useState<JsonType | null>(null);
  const [jsonData, setJsonData] = useState<DialogJson | MailJson | XmbJson | null>(null);
  const [translateJson, setTranslateJson] = useState<DialogJson | MailJson | XmbJson | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      readJsonFile(file);
    }
  };

  const readJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result;
        if (fileContent) {
          const json: DialogJson | MailJson | XmbJson = JSON.parse(fileContent as string);
          console.log('读取 JSON 文件:', json);
          if ("filename" in json && json.filename && "strings" in json && json.strings) {
            setJsonType("dialog");
            setJsonData(json);
            setTranslateJson(json);
          } else if ("root" in json && json.root && "mail" in json.root && json.root.mail) {
            setJsonType("mail");
            setJsonData(json);
            setTranslateJson(json);
          } else if (Array.isArray(json) && "_offset" in json[0]) {
            setJsonType("xmb");
            setJsonData(json);
            setTranslateJson(_.uniqBy(json, "_offset"));
          }
        }
      } catch (error) {
        console.error('JSON 解析错误:', error);
      }
    };
    reader.readAsText(file);
  };

  const savetranslateJson = () => {
    if (selectedFile && translateJson) {
      const jsonString = JSON.stringify(translateJson, null, 2);

      const blob = new Blob([jsonString], { type: 'application/json' });

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile.name;
      a.click();

      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <Navbar
        selectedFile={selectedFile}
        jsonData={jsonData}
        handleFileChange={handleFileChange}
        savetranslateJson={savetranslateJson}
      />
      <main className="py-12">
        {
          jsonType === "dialog" && translateJson
          &&
          <DialogEditor
            jsonData={jsonData as DialogJson}
            translateJson={translateJson as DialogJson}
            setTranslateJson={setTranslateJson}
          />
        }
        {
          jsonType === "mail" && translateJson
          &&
          <MailEditor
            jsonData={jsonData as MailJson}
            translateJson={translateJson as MailJson}
            setTranslateJson={setTranslateJson}
          />
        }
        {
          jsonType === "xmb" && translateJson
          &&
          <XmbEditor
            jsonData={jsonData as XmbJson}
            translateJson={translateJson as XmbJson}
            setTranslateJson={setTranslateJson}
          />
        }
      </main>
    </div>
  );
}
