import { useState } from 'react'

const ASCII_ARTS = [
  `   ／l、
 （ﾟ､ ｡７
   l  ~ヽ
   じしf_,)ノ`,
  `   ∧_∧
  ( ･ω･)
  ｜⊃／(＿＿＿
 ／└-(＿＿＿_／
 ￣￣￣￣￣￣`,
  `─▄▄─▄▄▀▀▄▀▀▄
███████───▄▀
▀█████▀▀▄▀
──▀█▀ ♥♥`,
  `╔╦╦╦═╦╗╔═╦═╦══╦═╗
║║║║╩╣╚╣═╣║║║║║╩╣
╚══╩═╩═╩═╩═╩╩╩╩═╝`,
]

export default function AsciiWidget() {
  const [artIndex, setArtIndex] = useState(0)

  const nextArt = () => {
    setArtIndex((prev) => (prev + 1) % ASCII_ARTS.length)
  }

  return (
    <div 
      className="glass rounded-2xl p-6 flex items-center justify-center h-full min-h-[200px] cursor-pointer hover:bg-white/5 transition-all"
      onClick={nextArt}
      title="Кликни для смены"
    >
      <pre className="text-white/80 text-sm leading-tight font-mono">
        {ASCII_ARTS[artIndex]}
      </pre>
    </div>
  )
}
