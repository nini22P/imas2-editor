import TextareaAutosize from 'react-textarea-autosize';

import { DialogJson } from "@/app/page";

const DialogEditor = ({ jsonData, translateJson, setTranslateJson }
  : { jsonData: DialogJson, translateJson: DialogJson, setTranslateJson: (json: DialogJson) => void }) => {

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    const newStrings = [...translateJson.strings];
    newStrings[index] = event.target.value;
    setTranslateJson({ ...translateJson, strings: newStrings });
  };

  return (
    <div className="p-4 space-y-2 max-w-6xl mx-auto">
      {
        jsonData.strings.map((dialogItem, index) =>
          <div key={index} className="grid grid-cols-2 max-lg:grid-cols-1 gap-2">
            <div className="space-y-1">
              <span className="text-sm font-light bg-cyan-100 px-2 py-1 rounded-lg">原文 {index + 1}</span>
              <TextareaAutosize
                value={dialogItem}
                disabled
                readOnly
                className="w-full bg-gray-50 p-1 rounded-lg resize-none"
              />
            </div>
            <div className="space-y-1">
              <span
                className={`text-sm font-light px-2 py-1 rounded-lg 
                  ${dialogItem.split('\n').length !== translateJson.strings[index].split('\n').length
                    ? "bg-red-200"
                    // : dialogItem === translateJson.strings[index]
                    //   ? "bg-yellow-100"
                    : "bg-green-100"}
                `}
              >
                译文 {index + 1}
              </span>
              <TextareaAutosize
                value={translateJson.strings[index]}
                onChange={(event) => handleTextChange(event, index)}
                className="w-full bg-slate-100 p-1 rounded-lg resize-none"
              />
            </div>
          </div>
        )
      }
    </div>
  );
}

export default DialogEditor;