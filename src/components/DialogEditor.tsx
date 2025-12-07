import TextareaAutosize from 'react-textarea-autosize';

import checkCharacters from '../utils/checkCharacters';
import { useState } from 'react';
import PageChanger from './PageChanger';
import type { Dialog } from '../App';

const DialogEditor = ({ data, setData }: { data: Dialog, setData: (data: Dialog) => void }) => {

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    const newStrings = [...data.translate];
    newStrings[index] = event.target.value;
    setData({ ...data, translate: newStrings });
  };

  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.strings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = data.strings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="p-4 space-y-1 max-w-6xl mx-auto">
        {
          currentItems.map((dialogItem, index) =>
            <div key={index} className="grid grid-cols-2 max-lg:grid-cols-1 gap-2">
              <div className="space-y-1">
                <span className="text-sm font-light px-2 rounded bg-cyan-100">原文 {startIndex + index + 1}</span>
                <TextareaAutosize
                  value={dialogItem}
                  disabled
                  readOnly
                  className="w-full bg-stone-100 p-1 rounded resize-none"
                />
              </div>
              <div className="space-y-1">
                <span className="flex gap-1">
                  <span
                    className={`text-sm font-light px-2 rounded
                    ${
                      // dialogItem.split('\n').length !== translateJson.strings[index].split('\n').length ||
                      checkCharacters(data.strings[startIndex + index]).length > 0
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
                    checkCharacters(data.translate[startIndex + index]).length > 0
                    &&
                    <span className='text-sm font-light px-2 rounded bg-red-300'>
                      {checkCharacters(data.translate[startIndex + index]).join('')}
                    </span>
                  }
                </span>
                <TextareaAutosize
                  value={data.translate[startIndex + index]}
                  onChange={(event) => handleTextChange(event, startIndex + index)}
                  className="w-full  bg-slate-100 p-1 rounded resize-none shadow-inner-sm"
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