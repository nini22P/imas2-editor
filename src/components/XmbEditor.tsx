import TextareaAutosize from 'react-textarea-autosize'
import { useMemo, memo } from 'react'
import PageChanger from './PageChanger'
import type { Xmb, XmbItem } from '../App'
import checkCharacters from '../utils/checkCharacters'

const getUTF16BEByteLength = (str: string) => {
  let byteLength = 0
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    // 判断是否为代理对高位 (surrogate high)
    if (code >= 0xD800 && code <= 0xDBFF) {
      byteLength += 4 // 代理对占4字节
      i++
    } else {
      byteLength += 2 // 非代理对字符占2字节
    }
  }
  return byteLength
}

const checkByteLength = (str: string, maxLength: number) => (getUTF16BEByteLength(str) <= maxLength)

const splitStringByLength = (str: string, len: number) => {
  const regex = new RegExp(`.{1,${len}}`, 'g')
  return str.match(regex) || []
}

interface XmbRowProps {
  item: XmbItem;
  displayIndex: number;
  enableCharacterCheck: boolean;
  onTextChange: (value: string, offset: number) => void;
  onAdd: (offset: number) => void;
  onRemove: (offset: number) => void;
  onAutoFormat: (offset: number) => void;
}

const XmbRow = memo(({ item, displayIndex, enableCharacterCheck, onTextChange, onAdd, onRemove, onAutoFormat }: XmbRowProps) => {
  const { _text, translate, _offset, _size } = item

  const translationText = translate || ''
  const isByteLengthValid = useMemo(() => checkByteLength(translationText, _size), [translationText, _size])
  const invalidChars = useMemo(() => enableCharacterCheck ? checkCharacters(translationText) : [], [enableCharacterCheck, translationText])

  return (
    <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-2">
      <div className="space-y-1">
        <span className="text-sm font-light bg-cyan-100 px-2 rounded">原文 {displayIndex}</span>
        <TextareaAutosize
          value={_text}
          disabled
          readOnly
          className="w-full bg-stone-100 p-1 rounded resize-none"
        />
      </div>
      {translate == null ? (
        <button onClick={() => onAdd(_offset)}>添加</button>
      ) : (
        <div className="space-y-1">
          <span className="flex gap-1 flex-wrap">
            <span className={`text-sm font-light px-2 rounded ${!isByteLengthValid || invalidChars.length > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              译文 {displayIndex}
            </span>

            {!isByteLengthValid && (
              <span className='text-xs font px-2 rounded bg-red-400'>
                字符长度超出
              </span>
            )}

            {invalidChars.length > 0 && (
              <span className='text-sm font-light px-2 rounded bg-red-300'>
                {invalidChars.join('')}
              </span>
            )}

            <span className='flex-1'></span>
            <button onClick={() => onAutoFormat(_offset)} className='text-xs px-1'>邮件自动排版</button>
            <button onClick={() => onRemove(_offset)} className='text-xs px-1'>删除</button>
          </span>
          <TextareaAutosize
            value={translationText}
            onChange={(e) => onTextChange(e.target.value, _offset)}
            className="w-full bg-slate-100 p-1 rounded resize-none shadow-inner-sm"
          />
        </div>
      )}
    </div>
  )
})

XmbRow.displayName = 'XmbRow'

interface XmbEditorProps {
  data: Xmb;
  enableCharacterCheck: boolean;
  setData: React.Dispatch<React.SetStateAction<Xmb>>;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const XmbEditor = ({ data, enableCharacterCheck, setData, currentPage, onPageChange }: XmbEditorProps) => {
  const ITEMS_PER_PAGE = 40

  const totalPages = Math.ceil((data?.length || 0) / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const currentItems = useMemo(() =>
    Array.isArray(data) ? data.slice(startIndex, startIndex + ITEMS_PER_PAGE) : [],
    [data, startIndex]
  )

  if (!data || !Array.isArray(data)) {
    return <div className="p-4 text-center text-gray-400">数据加载中或格式错误...</div>
  }

  const handleTextChange = (value: string, offset: number) => {
    setData(prevData => {
      const index = prevData.findIndex(item => item._offset === offset)
      if (index === -1) return prevData

      const newData = [...prevData]
      newData[index] = { ...newData[index], translate: value }
      return newData
    })
  }

  const handleClickRemove = (offset: number) => {
    setData(prevData => {
      const index = prevData.findIndex(item => item._offset === offset)
      if (index === -1) return prevData

      const newData = [...prevData]
      newData[index] = { ...newData[index], translate: null }
      return newData
    })
  }

  const handleClickAdd = (offset: number) => {
    setData(prevData => {
      const index = prevData.findIndex(item => item._offset === offset)
      if (index === -1) return prevData

      const newData = [...prevData]
      newData[index] = { ...newData[index], translate: newData[index]._text }
      return newData
    })
  }

  const handleClickAutoFormat = (offset: number) => {
    setData(prevData => {
      const index = prevData.findIndex(item => item._offset === offset)
      if (index === -1) return prevData

      const newData = [...prevData]
      const currentText = newData[index].translate

      if (currentText) {
        const newText = currentText.split('\n')
          .map(line => splitStringByLength(line, 14).join('\n'))
          .join('\n')
        newData[index] = { ...newData[index], translate: newText }
      }
      return newData
    })
  }

  return (
    <>
      <div className="p-4 space-y-1 max-w-6xl mx-auto">
        {currentItems.map((xmbItem, index) => (
          <XmbRow
            key={xmbItem._offset}
            item={xmbItem}
            displayIndex={startIndex + index + 1}
            enableCharacterCheck={enableCharacterCheck}
            onTextChange={handleTextChange}
            onAdd={handleClickAdd}
            onRemove={handleClickRemove}
            onAutoFormat={handleClickAutoFormat}
          />
        ))}
      </div>
      <PageChanger
        totalPages={totalPages}
        currentPage={currentPage}
        handlePageChange={onPageChange}
      />
    </>
  )
}

export default XmbEditor