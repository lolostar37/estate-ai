'use client'

import { useState } from 'react'

type Suggestion = {
  name:string
  current_price:number
  fair_value:number
  bubble_rate:number
  opinion:string
}

const districtMap:any={

  "잠실":"11710",
  "리센츠":"11710",
  "잠실엘스":"11710",
  "헬리오시티":"11710",

  "래미안대치팰리스":"11680",
  "은마":"11680",

  "아크로리버파크":"11650"
}

export default function Home(){

const [district,setDistrict]=useState("11710")
const [search,setSearch]=useState("")
const [suggestions,setSuggestions]=useState<Suggestion[]>([])

async function searchApartments(keyword:string){

setSearch(keyword)

if(keyword.length<1){

setSuggestions([])
return

}

const response=
await fetch("/api/search",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

keyword

})

})

const data=
await response.json()

if(data.success){

setSuggestions(data.data)

}

}

return(

<main className="min-h-screen bg-black text-white p-10">

<h1 className="text-5xl font-bold mb-2">
ESTATE AI
</h1>

<p className="mb-10 text-zinc-400">
AI 기반 부동산 투자 비서
</p>

<div className="flex gap-3">

<select
value={district}
onChange={(e)=>
setDistrict(e.target.value)
}
className="bg-zinc-900 p-4 rounded"
>

<option value="11710">
송파구
</option>

<option value="11680">
강남구
</option>

<option value="11650">
서초구
</option>

</select>


<div className="relative flex-1">

<input

value={search}

onChange={(e)=>
searchApartments(
e.target.value
)
}

placeholder="예: 잠실"

className="
w-full
p-4
rounded
bg-zinc-900
"

/>


{suggestions.length>0 &&(

<div
className="
absolute
w-full
bg-zinc-900
border
border-zinc-700
rounded-xl
mt-2
z-50
"
>

{suggestions.map((item)=>(

<button

key={item.name}

onClick={()=>{

setSearch(item.name)

const districtCode=

districtMap[item.name]

if(districtCode){

setDistrict(
districtCode
)

}

setSuggestions([])

}}

className="
block
w-full
text-left
px-4
py-3
hover:bg-zinc-800
"

>

<div className="font-bold">

{item.name}

</div>

<div className="text-sm text-zinc-400">

실거래:
{item.current_price}억

</div>

</button>

))}

</div>

)}

</div>

<button
className="
bg-yellow-500
text-black
font-bold
px-8
rounded
"
>

AI 분석

</button>

</div>

</main>

)

}