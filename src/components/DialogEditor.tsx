import TextareaAutosize from 'react-textarea-autosize'
import checkCharacters from '../utils/checkCharacters'
import { memo, useMemo } from 'react'
import PageChanger from './PageChanger'
import type { Dialog } from '../App'

const getLongestLineExceededCountConcise = (text: string, length: number): number => {
  const lines = text.split('\n')

  const getWeightedLineLength = (line: string): number => {
    let weightedLength = 0
    for (const char of line) {
      if (/[a-zA-Z0-9]/.test(char)) {
        weightedLength += 0.6
      } else {
        weightedLength += 1.0
      }
    }
    return weightedLength
  }

  const weightedLengths = lines.map(getWeightedLineLength)
  const maxWeightedLength = weightedLengths.reduce((max, len) => Math.max(max, len), 0)

  return Math.max(0, maxWeightedLength - length)
}

interface DialogRowProps {
  original: string;
  translation: string;
  globalIndex: number;
  displayIndex: number;
  enableCharacterCheck: boolean;
  onTranslateChange: (value: string, index: number) => void;
}

const DialogRow = memo(({ original, translation, globalIndex, displayIndex, enableCharacterCheck, onTranslateChange }: DialogRowProps) => {
  const invalidChars = useMemo(() => enableCharacterCheck ? checkCharacters(translation) : [], [enableCharacterCheck, translation])
  const exceededCount = useMemo(() => getLongestLineExceededCountConcise(translation, 26), [translation])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTranslateChange(e.target.value, globalIndex)
  }

  return (
    <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-2">
      <div className="space-y-0">
        <span className="flex gap-1 flex-wrap">
          <span className="text-sm font-light px-2 rounded-t bg-cyan-100">
            原文 {displayIndex}
          </span>
        </span>
        <TextareaAutosize
          value={original}
          disabled
          readOnly
          spellCheck={false}
          className="w-full bg-stone-100 p-1 rounded-b rounded-tr resize-none"
        />
      </div>
      <div className="space-y-0">
        <span className="flex gap-1 flex-wrap">
          <span
            className={`text-sm font-light px-2 rounded-t ${invalidChars.length > 0 || exceededCount > 0 ? 'bg-red-100' : 'bg-green-100'}`}
          >
            译文 {displayIndex}
          </span>
          {invalidChars.length > 0 && (
            <span className='text-sm font-light px-2 rounded bg-red-300'>
              {invalidChars.join('')}
            </span>
          )}
          {exceededCount > 0 && (
            <span className='text-sm font-light px-2 rounded bg-red-300'>
              单行超出 {exceededCount.toFixed(1)} 个字符
            </span>
          )}
        </span>
        <TextareaAutosize
          value={translation}
          onChange={handleChange}
          spellCheck={false}
          className="w-full bg-slate-100 p-1 rounded-b rounded-tr resize-none shadow-inner-sm"
        />
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.translation === nextProps.translation &&
    prevProps.original === nextProps.original &&
    prevProps.globalIndex === nextProps.globalIndex
  )
})

DialogRow.displayName = 'DialogRow'

interface DialogEditorProps {
  data: Dialog;
  enableCharacterCheck: boolean;
  setData: React.Dispatch<React.SetStateAction<Dialog>>;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const DialogEditor = ({ data, enableCharacterCheck, setData, currentPage, onPageChange }: DialogEditorProps) => {
  const ITEMS_PER_PAGE = 50

  const totalPages = Math.ceil((data?.strings?.length || 0) / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const currentItemsOriginal = useMemo(() =>
    data?.strings?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || [],
    [data?.strings, startIndex])

  const currentItemsTranslate = useMemo(() =>
    data?.translate?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || [],
    [data?.translate, startIndex])

  const handleTextChange = (value: string, index: number) => {
    setData(prevData => {
      if (!prevData || !prevData.translate) return prevData
      return {
        ...prevData,
        translate: prevData.translate.map((item, i) => i === index ? value : item)
      }
    })
  }

  if (!data || !data.strings || !data.translate) {
    return <div className="p-4 text-center text-gray-400">数据加载中或格式错误...</div>
  }

  return (
    <>
      <div className="p-4 space-y-1 max-w-6xl mx-auto">
        {currentItemsOriginal.map((originalText, index) => {
          const globalIndex = startIndex + index
          return (
            <DialogRow
              key={globalIndex}
              globalIndex={globalIndex}
              displayIndex={globalIndex + 1}
              original={originalText}
              enableCharacterCheck={enableCharacterCheck}
              translation={currentItemsTranslate[index]}
              onTranslateChange={handleTextChange}
            />
          )
        })}
      </div>
      <PageChanger
        totalPages={totalPages}
        currentPage={currentPage}
        handlePageChange={onPageChange}
      />
    </>
  )
}

export default DialogEditor