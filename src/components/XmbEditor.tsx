import TextareaAutosize from 'react-textarea-autosize';

import { useState } from 'react';
import PageChanger from './PageChanger';
import type { Xmb } from '../App';
import checkCharacters from '../utils/checkCharacters';

const XmbEditor = ({ data, setData }
  : { data: Xmb, setData: (json: Xmb) => void }) => {

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>, offset: number) => {
    const newXmbJson = [...data];
    const newXmbJsonIndex = newXmbJson.findIndex(xmbItem => xmbItem._offset === offset);
    newXmbJson[newXmbJsonIndex] = { ...newXmbJson[newXmbJsonIndex], translate: event.target.value };
    setData(newXmbJson);
  };

  const handleClickRemove = (offset: number) => {
    const index = data.findIndex(xmbItem => xmbItem._offset === offset);
    const newXmbJson = [...data];
    newXmbJson[index] = { ...newXmbJson[index], translate: null };
    setData(newXmbJson);
  }

  const handleClickAdd = (offset: number) => {
    const index = data.findIndex(xmbItem => xmbItem._offset === offset);
    const newXmbJson = [...data];
    newXmbJson[index] = { ...newXmbJson[index], translate: newXmbJson[index]._text };
    setData(newXmbJson);
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

  const ITEMS_PER_PAGE = 40;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="p-4 space-y-1 max-w-6xl mx-auto">
        {
          currentItems.map((xmbItem, index) =>
            <div
              key={index}
              className="grid grid-cols-2 max-lg:grid-cols-1 gap-2"
            >
              <div className="space-y-1">
                <span className="text-sm font-light bg-cyan-100 px-2 rounded">原文 {startIndex + index + 1}</span>
                <TextareaAutosize
                  value={xmbItem._text}
                  disabled
                  readOnly
                  className="w-full bg-stone-100 p-1 rounded resize-none"
                />
              </div>
              {
                xmbItem.translate == null
                  ?
                  <button onClick={() => handleClickAdd(xmbItem._offset)}>添加</button>
                  :
                  <div className="space-y-1">
                    <span className="flex gap-1">
                      <span
                        className={`text-sm font-light px-2 rounded 
                        ${
                          // (translateJson.find(item => item._offset === xmbItem._offset)?._text.split('\n').length || 0) > xmbItem._text.split('\n').length || 
                          !checkByteLength(data.find(item => item._offset === xmbItem._offset)?.translate || '', xmbItem._size) ||
                            checkCharacters(data.find(item => item._offset === xmbItem._offset)?.translate || '').length > 0
                            ? "bg-red-100"
                            // : xmbItem._text === translateJson.find(item => item._offset === xmbItem._offset)?._text
                            //   ? "bg-yellow-100"
                            : "bg-green-100"
                          }
                      `}
                      >
                        译文 {startIndex + index + 1}
                      </span>
                      {
                        !checkByteLength(data.find(item => item._offset === xmbItem._offset)?.translate || '', xmbItem._size)
                        &&
                        <span className='text-xs font px-2 rounded bg-red-400'>
                          字符长度超出
                        </span>
                      }
                      {
                        checkCharacters(data.find(item => item._offset === xmbItem._offset)?.translate || '').length > 0
                        &&
                        <span className='text-sm font-light px-2 rounded bg-red-300'>
                          {checkCharacters(data.find(item => item._offset === xmbItem._offset)?.translate || '').join('')}
                        </span>
                      }
                      <button onClick={() => handleClickRemove(xmbItem._offset)} className='text-xs px-1'>删除</button>
                    </span>
                    <TextareaAutosize
                      value={data.find(item => item._offset === xmbItem._offset)?.translate || ''}
                      onChange={(event) => (handleTextChange(event, xmbItem._offset))}
                      className="w-full bg-slate-100 p-1 rounded resize-none"
                    />
                  </div>
              }
            </div>
          )
        }
      </div>
      <PageChanger
        totalPages={totalPages}
        currentPage={currentPage}
        handlePageChange={handlePageChange}
      />
    </>
  );
}

export default XmbEditor;