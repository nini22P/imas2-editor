import TextareaAutosize from 'react-textarea-autosize';

import { XmbJson } from "@/app/page";

const XmbEditor = ({ jsonData, translateJson, setTranslateJson }
  : { jsonData: XmbJson, translateJson: XmbJson, setTranslateJson: (json: XmbJson) => void }) => {

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>, offset: number) => {
    const newXmbJson = [...translateJson];
    const newXmbJsonIndex = newXmbJson.findIndex(xmbItem => xmbItem._offset === offset);
    newXmbJson[newXmbJsonIndex] = { ...newXmbJson[newXmbJsonIndex], _text: event.target.value };
    setTranslateJson(newXmbJson);
  };

  const handleClickRemove = (offset: number) => {
    const newXmbJson = [...translateJson].filter((xmbItem) => xmbItem._offset !== offset);
    setTranslateJson(newXmbJson);
  }

  const handleClickAdd = (index: number) => {
    const newXmbJson = [...translateJson, jsonData[index]!];

    const sortedXmbJson = jsonData
      .filter(xmbItem => newXmbJson.some(item => item._offset === xmbItem._offset))
      .map(xmbItem => newXmbJson.find(item => item._offset === xmbItem._offset)!);

    setTranslateJson(sortedXmbJson);
  }

  const getUTF16BEByteLength = (str: string) => {
    let byteLength = 0;

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);

      // 判断是否为代理对高位 (surrogate high)
      if (code >= 0xD800 && code <= 0xDBFF) {
        // 跳过下一个字符，因为这是代理对的低位部分
        byteLength += 4; // 代理对占4字节
        i++; // 跳过下一个低位字符
      } else {
        byteLength += 2; // 非代理对字符占2字节
      }
    }

    return byteLength;
  }

  const checkByteLength = (str: string, maxLength: number) => (getUTF16BEByteLength(str) <= maxLength);

  return (
    <div className="p-4 space-y-2 max-w-6xl mx-auto">
      {
        jsonData.map((xmbItem, index) =>
          <div key={index} className="grid grid-cols-2 max-lg:grid-cols-1 gap-2">
            <div className="space-y-1">
              <span className="text-sm font-light bg-cyan-100 px-2 py-1 rounded-lg">原文 {index + 1}</span>
              <TextareaAutosize
                value={xmbItem._text}
                disabled
                readOnly
                className="w-full bg-gray-50 p-1 rounded-lg resize-none"
              />
            </div>
            {
              translateJson.find(item => item._offset === xmbItem._offset)
                ? <div className="space-y-1">
                  <span
                    className={`text-sm font-light px-2 py-1 rounded-lg 
                  ${xmbItem._text.split('\n').length !== translateJson.find(item => item._offset === xmbItem._offset)?._text.split('\n').length
                        || !checkByteLength(translateJson.find(item => item._offset === xmbItem._offset)?._text || '', xmbItem._size)
                        ? "bg-red-200"
                        // : xmbItem._text === translateJson.find(item => item._offset === xmbItem._offset)?._text
                        //   ? "bg-yellow-100"
                        : "bg-green-100"}
                `}
                  >
                    译文 {index + 1}
                  </span>
                  <button onClick={() => handleClickRemove(xmbItem._offset)} className='text-xs px-1 py-[0.1rem] ml-1'>删除</button>
                  <TextareaAutosize
                    value={translateJson.find(item => item._offset === xmbItem._offset)?._text || ''}
                    onChange={(event) => handleTextChange(event, xmbItem._offset)}
                    className="w-full bg-slate-100 p-1 rounded-lg resize-none"
                  />
                </div>
                : <button onClick={() => handleClickAdd(index)}>添加</button>
            }
          </div>
        )
      }
    </div>
  );
}

export default XmbEditor;