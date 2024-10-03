import TextareaAutosize from 'react-textarea-autosize';

import { DialogJson } from "@/app/page";
import checkCharacters from '../utils/checkCharacters';
import { useState } from 'react';
import PageChanger from './PageChanger';

const DialogEditor = ({ jsonData, translateJson, setTranslateJson }
  : { jsonData: DialogJson, translateJson: DialogJson, setTranslateJson: (json: DialogJson) => void }) => {

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    const newStrings = [...translateJson.strings];
    newStrings[index] = event.target.value;
    setTranslateJson({ ...translateJson, strings: newStrings });
  };

  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(jsonData.strings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = jsonData.strings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="p-4 space-y-2 max-w-6xl mx-auto">
        {
          currentItems.map((dialogItem, index) =>
            <div key={index} className="grid grid-cols-2 max-lg:grid-cols-1 gap-2">
              <div className="space-y-1">
                <span className="text-sm font-light bg-cyan-100 px-2 py-1 rounded-lg">原文 {startIndex + index + 1}</span>
                <TextareaAutosize
                  value={dialogItem}
                  disabled
                  readOnly
                  className="w-full bg-gray-50 p-1 rounded-lg resize-none"
                />
              </div>
              <div className="space-y-1">
                <span className='space-x-1'>
                  <span
                    className={`text-sm font-light px-2 py-1 rounded-lg 
                    ${
                      // dialogItem.split('\n').length !== translateJson.strings[index].split('\n').length ||
                      checkCharacters(translateJson.strings[startIndex + index]).length > 0
                        ? "bg-red-100"
                        // : dialogItem === translateJson.strings[index]
                        //   ? "bg-yellow-100"
                        : "bg-green-100"
                      }
                `}
                  >
                    译文 {startIndex + index + 1}
                  </span>
                  {
                    checkCharacters(translateJson.strings[startIndex + index]).length > 0
                    &&
                    <span className='text-sm font-light px-2 py-1 rounded-lg bg-red-300'>
                      {checkCharacters(translateJson.strings[startIndex + index]).join('')}
                    </span>
                  }
                </span>
                <TextareaAutosize
                  value={translateJson.strings[startIndex + index]}
                  onChange={(event) => handleTextChange(event, startIndex + index)}
                  className="w-full bg-slate-100 p-1 rounded-lg resize-none"
                />
              </div>
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

export default DialogEditor;