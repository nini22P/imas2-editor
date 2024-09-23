import TextareaAutosize from 'react-textarea-autosize';

import { MailJson } from "@/app/page";

const MailEditor = ({ jsonData, translateJson, setTranslateJson }
  : { jsonData: MailJson, translateJson: MailJson, setTranslateJson: (json: MailJson) => void }) => {

  const handleBodyTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>, index: number) => {
    const newMail = JSON.parse(JSON.stringify(translateJson.root.mail));
    newMail[index].body.text_node["@_text"] = event.target.value;
    setTranslateJson({ root: { mail: newMail } });
  };

  const handleSubjectTextChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newMail = JSON.parse(JSON.stringify(translateJson.root.mail));
    newMail[index].subject.text_node["@_text"] = event.target.value;
    setTranslateJson({ root: { mail: newMail } });
  }

  return (
    <div className="p-4 space-y-2 max-w-4xl mx-auto">
      {
        jsonData.root.mail.map((mailItem, index) =>
          <div key={index} className="grid grid-cols-2 max-sm:grid-cols-1 gap-2">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm font-light bg-cyan-100 px-2 py-1 rounded-lg">原文 {index + 1}</span>
                <input
                  type="text"
                  value={mailItem.subject.text_node["@_text"]}
                  disabled
                  readOnly
                  className="w-auto bg-gray-50 px-1 rounded-lg"
                />
              </div>
              <TextareaAutosize
                value={mailItem.body.text_node["@_text"]}
                disabled
                readOnly
                className="w-full bg-gray-50 p-1 rounded-lg resize-none"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span
                  className={`text-sm font-light px-2 py-1 rounded-lg 
                    ${mailItem.body.text_node["@_text"].split('\n').length !== translateJson.root.mail[index].body.text_node["@_text"].split('\n').length
                      ? "bg-red-100"
                      // : mailItem.body.text_node["@_text"] === translateJson.root.mail[index].body.text_node["@_text"]
                      //   ? "bg-yellow-100"
                      : "bg-green-100"}
                  `}
                >
                  译文 {index + 1}
                </span>
                <input
                  type="text"
                  value={translateJson.root.mail[index].subject.text_node["@_text"]}
                  onChange={(event) => handleSubjectTextChange(event, index)}
                  className="w-auto bg-slate-100 px-1 rounded-lg"
                />
              </div>
              <TextareaAutosize
                value={translateJson.root.mail[index].body.text_node["@_text"]}
                onChange={(event) => handleBodyTextChange(event, index)}
                className="w-full bg-slate-100 p-1 rounded-lg resize-none"
              />
            </div>
          </div>
        )
      }
    </div>
  );
}

export default MailEditor;