import imgLogoPng from "figma:asset/8789442c63cae6ce8bee2e41980635b315e3d0a1.png";
import imgImage from "figma:asset/b015191727695c9e8bd91edeb4f1203bfd9cbbf0.png";
import img285C5BMdoh55F75Png from "figma:asset/b947dec5803cc995658125211af93bb3319d0274.png";
import imgImage1 from "figma:asset/e17945b43c2743639bcbfa961f9b9c7b697fb93e.png";
import imgImage2 from "figma:asset/7615d3db1985346bf3765462a56a60209586cceb.png";

function LogoPng() {
  return <div className="bg-no-repeat bg-size-[100%_100%] bg-top-left h-5 shrink-0 w-[226px]" data-name="logo.png" style={{ backgroundImage: `url('${imgLogoPng}')` }} />;
}

function Margin() {
  return (
    <div className="box-border content-stretch flex flex-col h-5 items-start justify-start pl-0 pr-10 py-0 relative shrink-0 w-[266px]" data-name="Margin">
      <LogoPng />
    </div>
  );
}

function Item() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-start relative shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Semi_Bold',_'Noto_Sans_JP:Bold',_'Noto_Sans_SC:Bold',_sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#027f80] text-[18px] text-center text-nowrap">
        <p className="leading-[70px] whitespace-pre">套题练习</p>
      </div>
      <div className="absolute bg-[#027f80] bottom-4 h-0.5 left-7 rounded-[1px] w-11" data-name="Horizontal Divider" />
    </div>
  );
}

function Item1() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-start relative shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[18px] text-center text-nowrap">
        <p className="leading-[70px] whitespace-pre">听力题库</p>
      </div>
    </div>
  );
}

function Item2() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-start relative shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[18px] text-center text-nowrap">
        <p className="leading-[70px] whitespace-pre">阅读题库</p>
      </div>
    </div>
  );
}

function Item3() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-start relative shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[18px] text-center text-nowrap">
        <p className="leading-[70px] whitespace-pre">写作题库</p>
      </div>
    </div>
  );
}

function Item4() {
  return (
    <div className="content-stretch flex flex-col h-full items-center justify-start relative shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[18px] text-center text-nowrap">
        <p className="leading-[70px] whitespace-pre">口语题库</p>
      </div>
    </div>
  );
}

function List() {
  return (
    <div className="content-stretch flex h-[70px] items-start justify-start relative shrink-0 w-[500px]" data-name="List">
      <Item />
      <Item1 />
      <Item2 />
      <Item3 />
      <Item4 />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0" data-name="Container">
      <List />
    </div>
  );
}

function Container1() {
  return (
    <div className="box-border content-stretch flex flex-col items-center justify-start pl-7 pr-0 py-0 relative shrink-0" data-name="Container">
      <div className="absolute bg-no-repeat bg-size-[100%_100%] bg-top-left h-4 left-0 top-[27px] w-[18px]" data-name="Image" style={{ backgroundImage: `url('${imgImage}')` }} />
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#ff4d4f] text-[14px] text-center text-nowrap">
        <p className="leading-[70px] whitespace-pre">2023年托福改革说明</p>
      </div>
    </div>
  );
}

function Margin1() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-start px-5 py-0 relative shrink-0 z-[2]" data-name="Margin">
      <Container1 />
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex flex-col h-[38px] items-center justify-start relative shrink-0 w-[70px] z-[1]" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[14px] text-center text-nowrap">
        <p className="leading-[38px] whitespace-pre">登录/注册</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="box-border content-stretch flex h-[70px] isolate items-center justify-end pl-0 pr-[25px] py-0 relative shrink-0 w-[386px]" data-name="Container" style={{ gap: "8.52651e-14px" }}>
      <Margin1 />
      <Container2 />
    </div>
  );
}

function Container4() {
  return (
    <div className="content-stretch flex items-center justify-start relative shrink-0 w-[1152px]" data-name="Container">
      <Margin />
      <Container />
      <Container3 />
    </div>
  );
}

function BackgroundShadow() {
  return (
    <div className="bg-white box-border content-stretch flex flex-col h-[70px] items-center justify-start relative shadow-[0px_0px_8px_0px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Background+Shadow">
      <Container4 />
    </div>
  );
}

function Margin2() {
  return <div className="self-stretch shrink-0 w-[1172px]" data-name="Margin" />;
}

function Component285C5BMdoh55F75Png() {
  return <div className="bg-no-repeat bg-size-[100%_100%] bg-top-left h-[81px] shrink-0 w-full" data-name="285c5b_mdoh55f75.png" style={{ backgroundImage: `url('${img285C5BMdoh55F75Png}')` }} />;
}

function Container5() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow items-start justify-start min-h-px min-w-px relative shrink-0 w-[1152px]" data-name="Container">
      <Component285C5BMdoh55F75Png />
    </div>
  );
}

function Margin3() {
  return (
    <div className="box-border content-stretch flex flex-col items-start justify-center pl-0 pr-5 py-0 relative self-stretch shrink-0 w-[1172px]" data-name="Margin">
      <Container5 />
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex items-start justify-start left-[-1172px] right-[-5880px] top-0" data-name="Container">
      <Margin2 />
      <Margin3 />
      <Margin2 />
      <Margin2 />
      <Margin2 />
      <Margin2 />
      <Margin2 />
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[81px] overflow-clip relative shrink-0 w-full" data-name="Container">
      <Container6 />
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col h-[52px] items-end justify-start relative shrink-0 w-16" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#666666] text-[18px] text-nowrap text-right">
        <p className="leading-[52px] whitespace-pre">题库：</p>
      </div>
    </div>
  );
}

function Margin9() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start pl-0 pr-3 py-0 relative shrink-0 w-[76px]" data-name="Margin">
      <Container8 />
    </div>
  );
}

function Item5() {
  return (
    <div className="bg-[#f7b521] content-stretch flex flex-col h-8 items-center justify-start relative rounded-[5px] shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Bold',_'Noto_Sans_JP:Bold',_'Noto_Sans_SC:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-black text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">TPO套题</p>
      </div>
    </div>
  );
}

function ItemMargin() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start px-[5px] py-2.5 relative shrink-0 w-[110px]" data-name="Item:margin">
      <Item5 />
    </div>
  );
}

function Item6() {
  return (
    <div className="content-stretch flex flex-col h-8 items-center justify-start relative rounded-[5px] shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Bold',_'Noto_Sans_JP:Bold',_'Noto_Sans_SC:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-black text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">真题套题</p>
      </div>
    </div>
  );
}

function ItemMargin1() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start px-[5px] py-2.5 relative shrink-0 w-[110px]" data-name="Item:margin">
      <Item6 />
    </div>
  );
}

function List1() {
  return (
    <div className="content-start flex flex-wrap gap-0 items-start justify-start relative shrink-0" data-name="List">
      <ItemMargin />
      <ItemMargin1 />
    </div>
  );
}

function Background() {
  return (
    <div className="bg-[#edf1fd] content-stretch flex items-start justify-center relative rounded-[13px] shrink-0 w-[78px]" data-name="Background">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#c2353c] text-[15px] text-center text-nowrap">
        <p className="leading-[26px] whitespace-pre">{`去邀请>`}</p>
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-white box-border content-stretch flex gap-3 h-8 items-center justify-start pb-px pl-3 pr-1 pt-0 relative rounded-[16px] shrink-0" data-name="Background">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#102527] text-[15px] text-nowrap">
        <p className="leading-[32px] whitespace-pre">邀请好友注册，免费解锁全部真题</p>
      </div>
      <Background />
    </div>
  );
}

function Margin10() {
  return (
    <div className="box-border content-stretch flex flex-col h-8 items-start justify-start pl-[30px] pr-0 py-0 relative shrink-0" data-name="Margin">
      <Background1 />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex items-center justify-start relative self-stretch shrink-0 w-[1000px]" data-name="Container">
      <List1 />
      <Margin10 />
    </div>
  );
}

function Background2() {
  return (
    <div className="absolute bg-[#f0f2f5] content-stretch flex items-start justify-start left-0 right-0 top-0" data-name="Background">
      <Margin9 />
      <Container9 />
    </div>
  );
}

function Container10() {
  return (
    <div className="content-stretch flex flex-col h-[52px] items-end justify-start relative shrink-0 w-16" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#666666] text-[18px] text-nowrap text-right">
        <p className="leading-[52px] whitespace-pre">套题：</p>
      </div>
    </div>
  );
}

function Margin11() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start pl-0 pr-3 py-0 relative shrink-0 w-[76px]" data-name="Margin">
      <Container10 />
    </div>
  );
}

function Item7() {
  return (
    <div className="bg-[rgba(247,181,33,0.2)] content-stretch flex flex-col h-8 items-center justify-start relative rounded-[5px] shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#ce7600] text-[13.945px] text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">TPO 75-66</p>
      </div>
    </div>
  );
}

function ItemMargin2() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start px-[5px] py-2.5 relative shrink-0 w-[110px]" data-name="Item:margin">
      <Item7 />
    </div>
  );
}

function Item8() {
  return (
    <div className="content-stretch flex flex-col h-8 items-center justify-start relative rounded-[5px] shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[13.945px] text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">TPO 65-56</p>
      </div>
    </div>
  );
}

function ItemMargin3() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start px-[5px] py-2.5 relative shrink-0 w-[110px]" data-name="Item:margin">
      <Item8 />
    </div>
  );
}

function Item9() {
  return (
    <div className="content-stretch flex flex-col h-8 items-center justify-start relative rounded-[5px] shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[13.945px] text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">TPO 55-46</p>
      </div>
    </div>
  );
}

function ItemMargin4() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start px-[5px] py-2.5 relative shrink-0 w-[110px]" data-name="Item:margin">
      <Item9 />
    </div>
  );
}

function Item10() {
  return (
    <div className="content-stretch flex flex-col h-8 items-center justify-start relative rounded-[5px] shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[13.828px] text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">TPO 45-36</p>
      </div>
    </div>
  );
}

function ItemMargin5() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start px-[5px] py-2.5 relative shrink-0 w-[110px]" data-name="Item:margin">
      <Item10 />
    </div>
  );
}

function Item11() {
  return (
    <div className="content-stretch flex flex-col h-8 items-center justify-start relative rounded-[5px] shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[14.063px] text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">TPO 35-26</p>
      </div>
    </div>
  );
}

function ItemMargin6() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start px-[5px] py-2.5 relative shrink-0 w-[110px]" data-name="Item:margin">
      <Item11 />
    </div>
  );
}

function Item12() {
  return (
    <div className="content-stretch flex flex-col h-8 items-center justify-start relative rounded-[5px] shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[14.414px] text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">TPO 25-16</p>
      </div>
    </div>
  );
}

function ItemMargin7() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start px-[5px] py-2.5 relative shrink-0 w-[110px]" data-name="Item:margin">
      <Item12 />
    </div>
  );
}

function Item13() {
  return (
    <div className="content-stretch flex flex-col h-8 items-center justify-start relative rounded-[5px] shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[14.531px] text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">TPO 15-6</p>
      </div>
    </div>
  );
}

function ItemMargin8() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start px-[5px] py-2.5 relative shrink-0 w-[110px]" data-name="Item:margin">
      <Item13 />
    </div>
  );
}

function Item14() {
  return (
    <div className="content-stretch flex flex-col h-8 items-center justify-start relative rounded-[5px] shrink-0 w-[100px]" data-name="Item">
      <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[14.766px] text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">TPO 5-1</p>
      </div>
    </div>
  );
}

function ItemMargin9() {
  return (
    <div className="box-border content-stretch flex flex-col h-[52px] items-start justify-start px-[5px] py-2.5 relative shrink-0 w-[110px]" data-name="Item:margin">
      <Item14 />
    </div>
  );
}

function List2() {
  return (
    <div className="content-start flex flex-wrap gap-0 items-start justify-start relative shrink-0" data-name="List">
      <ItemMargin2 />
      <ItemMargin3 />
      <ItemMargin4 />
      <ItemMargin5 />
      <ItemMargin6 />
      <ItemMargin7 />
      <ItemMargin8 />
      <ItemMargin9 />
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex items-center justify-start relative self-stretch shrink-0 w-[1000px]" data-name="Container">
      <List2 />
    </div>
  );
}

function Background3() {
  return (
    <div className="absolute bg-[#f0f2f5] content-stretch flex items-start justify-start left-0 right-0 top-[52px]" data-name="Background">
      <Margin11 />
      <Container11 />
    </div>
  );
}

function Background4() {
  return (
    <div className="absolute bg-[#edf1fd] box-border content-stretch flex flex-col items-start justify-start left-2.5 min-h-8 pl-9 pr-[5px] py-0 rounded-[8px] top-[104px]" data-name="Background">
      <div className="absolute bg-no-repeat bg-size-[100%_100%] bg-top-left left-2 size-5 top-[5px]" data-name="Image" style={{ backgroundImage: `url('${imgImage1}')` }} />
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[32px] not-italic relative shrink-0 text-[#c30000] text-[13.891px] text-nowrap whitespace-pre">
        <p className="mb-0">托福官方每年发布的TPO（TOEFL Practice Online）是往年真题，不会再次出现在正式考试中，非常适合初学者进行基础练习。</p>
        <p>目前所有TPO阅读部分均已更新，与2023年改革后的考试形式完全一致：每套题包含两篇文章，每篇文章10道题目</p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[168px] relative shrink-0 w-full" data-name="Container">
      <Background2 />
      <Background3 />
      <Background4 />
    </div>
  );
}

function Container13() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[23.25px] text-white w-full">
        <p className="leading-[64px]">TPO 75</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0" data-name="Container">
      <Container13 />
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.875px] w-full">
        <p className="leading-[24px]">Reading</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item15() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container15 />
          <Container16 />
          <Container17 />
          <Overlay />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.625px] w-full">
        <p className="leading-[24px]">Listening</p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay1() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item16() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container18 />
          <Container19 />
          <Container20 />
          <Overlay1 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.5px] w-full">
        <p className="leading-[24px]">Speaking</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay2() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item17() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container21 />
          <Container22 />
          <Container23 />
          <Overlay2 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.25px] w-full">
        <p className="leading-[24px]">Writing</p>
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay3() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item18() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container24 />
          <Container25 />
          <Container26 />
          <Overlay3 />
        </div>
      </div>
    </div>
  );
}

function List3() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative w-full">
          <Item15 />
          <Item16 />
          <Item17 />
          <Item18 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[332px] items-start justify-start left-0 p-px right-0 rounded-[7px] top-16" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <List3 />
    </div>
  );
}

function Background5() {
  return (
    <div className="bg-[#2e686d] h-[395px] relative rounded-[8px] shrink-0 w-[264px]" data-name="Background">
      <Container14 />
      <BackgroundBorder />
    </div>
  );
}

function Margin12() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[395px] items-start justify-start left-0 pl-0 pr-8 py-0 top-0 w-[296px]" data-name="Margin">
      <Background5 />
    </div>
  );
}

function Container27() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[23.25px] text-white w-full">
        <p className="leading-[64px]">TPO 74</p>
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0" data-name="Container">
      <Container27 />
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.875px] w-full">
        <p className="leading-[24px]">Reading</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay4() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item19() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container29 />
          <Container30 />
          <Container31 />
          <Overlay4 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.625px] w-full">
        <p className="leading-[24px]">Listening</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay5() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item20() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container32 />
          <Container33 />
          <Container34 />
          <Overlay5 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.5px] w-full">
        <p className="leading-[24px]">Speaking</p>
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay6() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item21() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container35 />
          <Container36 />
          <Container37 />
          <Overlay6 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.25px] w-full">
        <p className="leading-[24px]">Writing</p>
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay7() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item22() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container38 />
          <Container39 />
          <Container40 />
          <Overlay7 />
        </div>
      </div>
    </div>
  );
}

function List4() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative w-full">
          <Item19 />
          <Item20 />
          <Item21 />
          <Item22 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[332px] items-start justify-start left-0 p-px right-0 rounded-[7px] top-16" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <List4 />
    </div>
  );
}

function Background6() {
  return (
    <div className="bg-[#2e686d] h-[395px] relative rounded-[8px] shrink-0 w-[264px]" data-name="Background">
      <Container28 />
      <BackgroundBorder1 />
    </div>
  );
}

function Margin13() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[395px] items-start justify-start left-[296px] pl-0 pr-8 py-0 top-0 w-[296px]" data-name="Margin">
      <Background6 />
    </div>
  );
}

function Container41() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[23.063px] text-white w-full">
        <p className="leading-[64px]">TPO 73</p>
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0" data-name="Container">
      <Container41 />
    </div>
  );
}

function Container43() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.875px] w-full">
        <p className="leading-[24px]">Reading</p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay8() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item23() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container43 />
          <Container44 />
          <Container45 />
          <Overlay8 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.625px] w-full">
        <p className="leading-[24px]">Listening</p>
      </div>
    </div>
  );
}

function Container47() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container48() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay9() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item24() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container46 />
          <Container47 />
          <Container48 />
          <Overlay9 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container49() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.5px] w-full">
        <p className="leading-[24px]">Speaking</p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay10() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item25() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container49 />
          <Container50 />
          <Container51 />
          <Overlay10 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.25px] w-full">
        <p className="leading-[24px]">Writing</p>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay11() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item26() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container52 />
          <Container53 />
          <Container54 />
          <Overlay11 />
        </div>
      </div>
    </div>
  );
}

function List5() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative w-full">
          <Item23 />
          <Item24 />
          <Item25 />
          <Item26 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder2() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[332px] items-start justify-start left-0 p-px right-0 rounded-[7px] top-16" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <List5 />
    </div>
  );
}

function Background7() {
  return (
    <div className="bg-[#2e686d] h-[395px] relative rounded-[8px] shrink-0 w-[264px]" data-name="Background">
      <Container42 />
      <BackgroundBorder2 />
    </div>
  );
}

function Margin14() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[395px] items-start justify-start left-[592px] pl-0 pr-8 py-0 top-0 w-[296px]" data-name="Margin">
      <Background7 />
    </div>
  );
}

function Container55() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[23.25px] text-white w-full">
        <p className="leading-[64px]">TPO 72</p>
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0" data-name="Container">
      <Container55 />
    </div>
  );
}

function Container57() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.875px] w-full">
        <p className="leading-[24px]">Reading</p>
      </div>
    </div>
  );
}

function Container58() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay12() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item27() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container57 />
          <Container58 />
          <Container59 />
          <Overlay12 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container60() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.625px] w-full">
        <p className="leading-[24px]">Listening</p>
      </div>
    </div>
  );
}

function Container61() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container62() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay13() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item28() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container60 />
          <Container61 />
          <Container62 />
          <Overlay13 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container63() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.5px] w-full">
        <p className="leading-[24px]">Speaking</p>
      </div>
    </div>
  );
}

function Container64() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container65() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay14() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item29() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container63 />
          <Container64 />
          <Container65 />
          <Overlay14 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container66() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.25px] w-full">
        <p className="leading-[24px]">Writing</p>
      </div>
    </div>
  );
}

function Container67() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container68() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay15() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item30() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container66 />
          <Container67 />
          <Container68 />
          <Overlay15 />
        </div>
      </div>
    </div>
  );
}

function List6() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative w-full">
          <Item27 />
          <Item28 />
          <Item29 />
          <Item30 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder3() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[332px] items-start justify-start left-0 p-px right-0 rounded-[7px] top-16" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <List6 />
    </div>
  );
}

function Background8() {
  return (
    <div className="absolute bg-[#2e686d] h-[395px] left-[888px] rounded-[8px] top-0 w-[264px]" data-name="Background">
      <Container56 />
      <BackgroundBorder3 />
    </div>
  );
}

function Container69() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[24px] text-white w-full">
        <p className="leading-[64px]">TPO 71</p>
      </div>
    </div>
  );
}

function Container70() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0" data-name="Container">
      <Container69 />
    </div>
  );
}

function Container71() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.875px] w-full">
        <p className="leading-[24px]">Reading</p>
      </div>
    </div>
  );
}

function Container72() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container73() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay16() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item31() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container71 />
          <Container72 />
          <Container73 />
          <Overlay16 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container74() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.625px] w-full">
        <p className="leading-[24px]">Listening</p>
      </div>
    </div>
  );
}

function Container75() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container76() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay17() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item32() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container74 />
          <Container75 />
          <Container76 />
          <Overlay17 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container77() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.5px] w-full">
        <p className="leading-[24px]">Speaking</p>
      </div>
    </div>
  );
}

function Container78() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container79() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay18() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item33() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container77 />
          <Container78 />
          <Container79 />
          <Overlay18 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container80() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.25px] w-full">
        <p className="leading-[24px]">Writing</p>
      </div>
    </div>
  );
}

function Container81() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container82() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay19() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item34() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container80 />
          <Container81 />
          <Container82 />
          <Overlay19 />
        </div>
      </div>
    </div>
  );
}

function List7() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative w-full">
          <Item31 />
          <Item32 />
          <Item33 />
          <Item34 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder4() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[332px] items-start justify-start left-0 p-px right-0 rounded-[7px] top-16" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <List7 />
    </div>
  );
}

function Background9() {
  return (
    <div className="bg-[#2e686d] h-[395px] relative rounded-[8px] shrink-0 w-[264px]" data-name="Background">
      <Container70 />
      <BackgroundBorder4 />
    </div>
  );
}

function Margin15() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[415px] items-start justify-start left-0 pb-0 pl-0 pr-8 pt-5 top-[395px] w-[296px]" data-name="Margin">
      <Background9 />
    </div>
  );
}

function Container83() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[22.875px] text-white w-full">
        <p className="leading-[64px]">TPO 70</p>
      </div>
    </div>
  );
}

function Container84() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0" data-name="Container">
      <Container83 />
    </div>
  );
}

function Container85() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.875px] w-full">
        <p className="leading-[24px]">Reading</p>
      </div>
    </div>
  );
}

function Container86() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container87() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay20() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item35() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container85 />
          <Container86 />
          <Container87 />
          <Overlay20 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container88() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.625px] w-full">
        <p className="leading-[24px]">Listening</p>
      </div>
    </div>
  );
}

function Container89() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container90() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay21() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item36() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container88 />
          <Container89 />
          <Container90 />
          <Overlay21 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container91() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.5px] w-full">
        <p className="leading-[24px]">Speaking</p>
      </div>
    </div>
  );
}

function Container92() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container93() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay22() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item37() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container91 />
          <Container92 />
          <Container93 />
          <Overlay22 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container94() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.25px] w-full">
        <p className="leading-[24px]">Writing</p>
      </div>
    </div>
  );
}

function Container95() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container96() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay23() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item38() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container94 />
          <Container95 />
          <Container96 />
          <Overlay23 />
        </div>
      </div>
    </div>
  );
}

function List8() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative w-full">
          <Item35 />
          <Item36 />
          <Item37 />
          <Item38 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder5() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[332px] items-start justify-start left-0 p-px right-0 rounded-[7px] top-16" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <List8 />
    </div>
  );
}

function Background10() {
  return (
    <div className="bg-[#2e686d] h-[395px] relative rounded-[8px] shrink-0 w-[264px]" data-name="Background">
      <Container84 />
      <BackgroundBorder5 />
    </div>
  );
}

function Margin16() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[415px] items-start justify-start left-[296px] pb-0 pl-0 pr-8 pt-5 top-[395px] w-[296px]" data-name="Margin">
      <Background10 />
    </div>
  );
}

function Container97() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[22.688px] text-white w-full">
        <p className="leading-[64px]">TPO 69</p>
      </div>
    </div>
  );
}

function Container98() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0" data-name="Container">
      <Container97 />
    </div>
  );
}

function Container99() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.875px] w-full">
        <p className="leading-[24px]">Reading</p>
      </div>
    </div>
  );
}

function Container100() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container101() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay24() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item39() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container99 />
          <Container100 />
          <Container101 />
          <Overlay24 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container102() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.625px] w-full">
        <p className="leading-[24px]">Listening</p>
      </div>
    </div>
  );
}

function Container103() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container104() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay25() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item40() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container102 />
          <Container103 />
          <Container104 />
          <Overlay25 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container105() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.5px] w-full">
        <p className="leading-[24px]">Speaking</p>
      </div>
    </div>
  );
}

function Container106() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container107() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay26() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item41() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container105 />
          <Container106 />
          <Container107 />
          <Overlay26 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container108() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.25px] w-full">
        <p className="leading-[24px]">Writing</p>
      </div>
    </div>
  );
}

function Container109() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container110() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay27() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item42() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container108 />
          <Container109 />
          <Container110 />
          <Overlay27 />
        </div>
      </div>
    </div>
  );
}

function List9() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative w-full">
          <Item39 />
          <Item40 />
          <Item41 />
          <Item42 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder6() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[332px] items-start justify-start left-0 p-px right-0 rounded-[7px] top-16" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <List9 />
    </div>
  );
}

function Background11() {
  return (
    <div className="bg-[#2e686d] h-[395px] relative rounded-[8px] shrink-0 w-[264px]" data-name="Background">
      <Container98 />
      <BackgroundBorder6 />
    </div>
  );
}

function Margin17() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[415px] items-start justify-start left-[592px] pb-0 pl-0 pr-8 pt-5 top-[395px] w-[296px]" data-name="Margin">
      <Background11 />
    </div>
  );
}

function Container111() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[22.688px] text-white w-full">
        <p className="leading-[64px]">TPO 68</p>
      </div>
    </div>
  );
}

function Container112() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0" data-name="Container">
      <Container111 />
    </div>
  );
}

function Container113() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.875px] w-full">
        <p className="leading-[24px]">Reading</p>
      </div>
    </div>
  );
}

function Container114() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container115() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay28() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item43() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container113 />
          <Container114 />
          <Container115 />
          <Overlay28 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container116() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.625px] w-full">
        <p className="leading-[24px]">Listening</p>
      </div>
    </div>
  );
}

function Container117() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container118() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay29() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item44() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container116 />
          <Container117 />
          <Container118 />
          <Overlay29 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container119() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.5px] w-full">
        <p className="leading-[24px]">Speaking</p>
      </div>
    </div>
  );
}

function Container120() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container121() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay30() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item45() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container119 />
          <Container120 />
          <Container121 />
          <Overlay30 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container122() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.25px] w-full">
        <p className="leading-[24px]">Writing</p>
      </div>
    </div>
  );
}

function Container123() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container124() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay31() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item46() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container122 />
          <Container123 />
          <Container124 />
          <Overlay31 />
        </div>
      </div>
    </div>
  );
}

function List10() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative w-full">
          <Item43 />
          <Item44 />
          <Item45 />
          <Item46 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder7() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[332px] items-start justify-start left-0 p-px right-0 rounded-[7px] top-16" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <List10 />
    </div>
  );
}

function Background12() {
  return (
    <div className="bg-[#2e686d] h-[395px] relative rounded-[8px] shrink-0 w-[264px]" data-name="Background">
      <Container112 />
      <BackgroundBorder7 />
    </div>
  );
}

function Margin18() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[415px] items-start justify-start left-[888px] pb-0 pt-5 px-0 top-[395px] w-[264px]" data-name="Margin">
      <Background12 />
    </div>
  );
}

function Container125() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[23.063px] text-white w-full">
        <p className="leading-[64px]">TPO 67</p>
      </div>
    </div>
  );
}

function Container126() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0" data-name="Container">
      <Container125 />
    </div>
  );
}

function Container127() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.875px] w-full">
        <p className="leading-[24px]">Reading</p>
      </div>
    </div>
  );
}

function Container128() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container129() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay32() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item47() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container127 />
          <Container128 />
          <Container129 />
          <Overlay32 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container130() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.625px] w-full">
        <p className="leading-[24px]">Listening</p>
      </div>
    </div>
  );
}

function Container131() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container132() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay33() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item48() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container130 />
          <Container131 />
          <Container132 />
          <Overlay33 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container133() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.5px] w-full">
        <p className="leading-[24px]">Speaking</p>
      </div>
    </div>
  );
}

function Container134() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container135() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay34() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item49() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container133 />
          <Container134 />
          <Container135 />
          <Overlay34 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container136() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.25px] w-full">
        <p className="leading-[24px]">Writing</p>
      </div>
    </div>
  );
}

function Container137() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container138() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay35() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item50() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container136 />
          <Container137 />
          <Container138 />
          <Overlay35 />
        </div>
      </div>
    </div>
  );
}

function List11() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative w-full">
          <Item47 />
          <Item48 />
          <Item49 />
          <Item50 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder8() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[332px] items-start justify-start left-0 p-px right-0 rounded-[7px] top-16" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <List11 />
    </div>
  );
}

function Background13() {
  return (
    <div className="bg-[#2e686d] h-[395px] relative rounded-[8px] shrink-0 w-[264px]" data-name="Background">
      <Container126 />
      <BackgroundBorder8 />
    </div>
  );
}

function Margin19() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[415px] items-start justify-start left-0 pb-0 pl-0 pr-8 pt-5 top-[810px] w-[296px]" data-name="Margin">
      <Background13 />
    </div>
  );
}

function Container139() {
  return (
    <div className="basis-0 content-stretch flex flex-col grow h-16 items-start justify-start min-h-px min-w-px relative shrink-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[22.688px] text-white w-full">
        <p className="leading-[64px]">TPO 66</p>
      </div>
    </div>
  );
}

function Container140() {
  return (
    <div className="absolute box-border content-stretch flex items-center justify-start left-0 px-4 py-0 right-0 top-0" data-name="Container">
      <Container139 />
    </div>
  );
}

function Container141() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.875px] w-full">
        <p className="leading-[24px]">Reading</p>
      </div>
    </div>
  );
}

function Container142() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container143() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay36() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item51() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container141 />
          <Container142 />
          <Container143 />
          <Overlay36 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container144() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.625px] w-full">
        <p className="leading-[24px]">Listening</p>
      </div>
    </div>
  );
}

function Container145() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container146() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay37() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item52() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container144 />
          <Container145 />
          <Container146 />
          <Overlay37 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container147() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.5px] w-full">
        <p className="leading-[24px]">Speaking</p>
      </div>
    </div>
  );
}

function Container148() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container149() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay38() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item53() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container147 />
          <Container148 />
          <Container149 />
          <Overlay38 />
          <div className="absolute bg-[#e6e6e6] bottom-0 h-[0.5px] left-3 w-[232px]" data-name="Horizontal Divider" />
        </div>
      </div>
    </div>
  );
}

function Container150() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Bold',_sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#444444] text-[15.25px] w-full">
        <p className="leading-[24px]">Writing</p>
      </div>
    </div>
  );
}

function Container151() {
  return (
    <div className="content-stretch flex flex-col items-start justify-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#21252a] text-[14px] w-full">
        <p className="leading-[21px]">未开始</p>
      </div>
    </div>
  );
}

function Container152() {
  return (
    <div className="absolute content-stretch flex flex-col h-[30px] items-center justify-start right-[90px] top-[27px] w-20" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">浏览试题</p>
      </div>
    </div>
  );
}

function Overlay39() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.05)] content-stretch flex flex-col h-[30px] items-center justify-start right-2 rounded-[17px] top-[27px] w-20" data-name="Overlay">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">开始模考</p>
      </div>
    </div>
  );
}

function Item54() {
  return (
    <div className="h-20 relative rounded-[8px] shrink-0 w-full" data-name="Item">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col gap-1 h-20 items-start justify-start pb-0 pt-4 px-4 relative w-full">
          <Container150 />
          <Container151 />
          <Container152 />
          <Overlay39 />
        </div>
      </div>
    </div>
  );
}

function List12() {
  return (
    <div className="relative shrink-0 w-full" data-name="List">
      <div className="relative size-full">
        <div className="box-border content-stretch flex flex-col items-start justify-start p-[4px] relative w-full">
          <Item51 />
          <Item52 />
          <Item53 />
          <Item54 />
        </div>
      </div>
    </div>
  );
}

function BackgroundBorder9() {
  return (
    <div className="absolute bg-white box-border content-stretch flex flex-col h-[332px] items-start justify-start left-0 p-px right-0 rounded-[7px] top-16" data-name="Background+Border">
      <div aria-hidden="true" className="absolute border border-[#ededed] border-solid inset-0 pointer-events-none rounded-[7px]" />
      <List12 />
    </div>
  );
}

function Background14() {
  return (
    <div className="bg-[#2e686d] h-[395px] relative rounded-[8px] shrink-0 w-[264px]" data-name="Background">
      <Container140 />
      <BackgroundBorder9 />
    </div>
  );
}

function Margin20() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[415px] items-start justify-start left-[296px] pb-0 pl-0 pr-8 pt-5 top-[810px] w-[296px]" data-name="Margin">
      <Background14 />
    </div>
  );
}

function Container153() {
  return (
    <div className="absolute content-stretch flex flex-col items-center justify-start left-0 right-0 top-[190px]" data-name="Container">
      <div className="flex flex-col font-['Inter:Medium',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[20px] text-black text-center text-nowrap">
        <p className="leading-[30px] whitespace-pre">点击查看下一组</p>
      </div>
    </div>
  );
}

function Background15() {
  return (
    <div className="absolute bg-[#fcf5e4] box-border content-stretch flex flex-col h-8 items-center justify-start min-w-[148px] px-[37.31px] py-0 rounded-[8px] top-[232px] translate-x-[-50%]" data-name="Background" style={{ left: "calc(50% + 0.31px)" }}>
      <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#ce7600] text-[13.828px] text-center text-nowrap">
        <p className="leading-[32px] whitespace-pre">TPO 65-56</p>
      </div>
    </div>
  );
}

function Background16() {
  return (
    <div className="bg-white h-[395px] relative rounded-[8px] shrink-0 w-[264px]" data-name="Background">
      <div className="absolute bg-no-repeat bg-size-[100%_100%] bg-top-left left-1/2 size-[66px] top-[92px] translate-x-[-50%]" data-name="Image" style={{ backgroundImage: `url('${imgImage2}')` }} />
      <Container153 />
      <Background15 />
    </div>
  );
}

function Margin21() {
  return (
    <div className="absolute box-border content-stretch flex flex-col h-[415px] items-start justify-start left-[592px] pb-0 pl-0 pr-8 pt-5 top-[810px] w-[296px]" data-name="Margin">
      <Background16 />
    </div>
  );
}

function Container154() {
  return (
    <div className="h-[1225px] relative shrink-0 w-full" data-name="Container">
      <Margin12 />
      <Margin13 />
      <Margin14 />
      <Background8 />
      <Margin15 />
      <Margin16 />
      <Margin17 />
      <Margin18 />
      <Margin19 />
      <Margin20 />
      <Margin21 />
    </div>
  );
}

function Container155() {
  return (
    <div className="content-stretch flex flex-col gap-5 items-start justify-start relative shrink-0 w-[1152px]" data-name="Container">
      <Container7 />
      <Container12 />
      <Container154 />
    </div>
  );
}

function Link() {
  return (
    <div className="box-border content-stretch flex items-start justify-center mr-[-0.01px] relative shrink-0" data-name="Link">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#222222] text-[11.438px] text-center text-nowrap">
        <p className="leading-[50px] whitespace-pre">渝ICP备2020010377号-5</p>
      </div>
    </div>
  );
}

function Container156() {
  return (
    <div className="absolute bottom-0 box-border content-stretch flex h-[50px] items-start justify-center left-0 pl-0 pr-[0.01px] py-0 right-0" data-name="Container">
      <div className="flex flex-col font-['Inter:Regular',_'Noto_Sans_JP:Regular',_sans-serif] font-normal justify-center leading-[0] mr-[-0.01px] not-italic relative shrink-0 text-[#495060] text-[12px] text-center text-nowrap">
        <p className="leading-[50px] whitespace-pre">{`版权© 2025 科悦睿博 `}</p>
      </div>
      <Link />
    </div>
  );
}

function Background17() {
  return (
    <div className="bg-[#f0f2f5] h-[100px] relative shrink-0 w-full" data-name="Background">
      <Container156 />
    </div>
  );
}

function Background18() {
  return (
    <div className="absolute bg-[#f0f2f5] content-stretch flex flex-col gap-5 items-center justify-start left-0 min-h-[1200px] right-0 top-0" data-name="Background">
      <BackgroundShadow />
      <Container155 />
      <Background17 />
    </div>
  );
}

export default function Container157() {
  return (
    <div className="relative size-full" data-name="Container">
      <Background18 />
    </div>
  );
}