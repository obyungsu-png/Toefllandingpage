import imgRectangle from "figma:asset/e5742b7862d7abe00fe8e304ef5b58aa0b6ae7ec.png";
import imgRectangle1 from "figma:asset/66d0b62bcc7d89b4a99def38075172adb7b56db7.png";
import imgRectangle2 from "figma:asset/0d8b9c627d995bc22672917d0260baaa356f4d87.png";
import imgRectangle3 from "figma:asset/58ccec52e81e2f05451818ba6c56f627d0ccb497.png";
import imgRectangle4 from "figma:asset/a893942edd107c981f6099cb5f377b968e6e5a32.png";
import imgRectangle5 from "figma:asset/ac271298f43a3ad4f0794541a75243c2ff6786bb.png";
import imgRectangle6 from "figma:asset/17daaa809ceaa126fb6ed9879a41213af8b43d55.png";

function Frame() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] h-[570px] left-0 overflow-clip top-0 w-[1920px]" data-name="Frame">
      <div className="absolute bg-center bg-cover bg-no-repeat h-[570px] left-0 top-0 w-[1920px]" data-name="Rectangle" style={{ backgroundImage: `url('${imgRectangle}')` }} />
    </div>
  );
}

function ContainerImage() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] h-[455px] left-[360px] overflow-clip top-[30px] w-[442px]" data-name="Container / Image">
      <div className="absolute bg-center bg-cover bg-no-repeat h-[455px] left-0 top-0 w-[442px]" data-name="Rectangle" style={{ backgroundImage: `url('${imgRectangle1}')` }} />
    </div>
  );
}

function ContainerImage1() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] h-[490px] left-[874px] overflow-clip top-[65px] w-[835px]" data-name="Container / Image">
      <div className="absolute bg-center bg-cover bg-no-repeat h-[490px] left-0 top-0 w-[835px]" data-name="Rectangle" style={{ backgroundImage: `url('${imgRectangle2}')` }} />
    </div>
  );
}

function ContainerBackgroundImage() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] h-[570px] left-0 top-0 w-[1920px]" data-name="Container+BackgroundImage">
      <Frame />
      <div className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal h-[21px] leading-[0] left-[1500px] not-italic text-[#222222] text-[14px] text-center top-[27.5px] translate-x-[-50%] w-[70px]">
        <p className="leading-[21px]">登录/注册</p>
      </div>
      <ContainerImage />
      <ContainerImage1 />
    </div>
  );
}

function ContainerImage2() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] h-[493px] left-[360px] overflow-clip top-[570px] w-[1200px]" data-name="Container / Image">
      <div className="absolute bg-center bg-cover bg-no-repeat h-[493px] left-0 top-0 w-[1200px]" data-name="Rectangle" style={{ backgroundImage: `url('${imgRectangle3}')` }} />
    </div>
  );
}

function ContainerImage3() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] h-[437px] left-[360px] overflow-clip top-0 w-[1200px]" data-name="Container / Image">
      <div className="absolute bg-center bg-cover bg-no-repeat h-[437px] left-0 top-0 w-[1200px]" data-name="Rectangle" style={{ backgroundImage: `url('${imgRectangle4}')` }} />
    </div>
  );
}

function ContainerBackgroundColor() {
  return (
    <div className="absolute bg-[#f7f4f4] h-[437px] left-0 top-[1063px] w-[1920px]" data-name="Container+BackgroundColor">
      <ContainerImage3 />
    </div>
  );
}

function ContainerImage4() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] h-[437px] left-[360px] overflow-clip top-[1500px] w-[1200px]" data-name="Container / Image">
      <div className="absolute bg-center bg-cover bg-no-repeat h-[437px] left-0 top-0 w-[1200px]" data-name="Rectangle" style={{ backgroundImage: `url('${imgRectangle5}')` }} />
    </div>
  );
}

function ContainerImage5() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] h-[417px] left-[360px] overflow-clip top-0 w-[1200px]" data-name="Container / Image">
      <div className="absolute bg-center bg-cover bg-no-repeat h-[417px] left-0 top-0 w-[1200px]" data-name="Rectangle" style={{ backgroundImage: `url('${imgRectangle6}')` }} />
    </div>
  );
}

function ContainerBackgroundColor1() {
  return (
    <div className="absolute bg-[#f7f4f4] h-[417px] left-0 top-[1937px] w-[1920px]" data-name="Container+BackgroundColor">
      <ContainerImage5 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0)] h-[2454px] left-0 top-0 w-[1920px]" data-name="Container">
      <ContainerBackgroundImage />
      <ContainerImage2 />
      <ContainerBackgroundColor />
      <ContainerImage4 />
      <ContainerBackgroundColor1 />
      <div className="absolute font-['Inter:Regular',_'Noto_Sans_JP:Regular',_'Noto_Sans_SC:Regular',_sans-serif] font-normal h-[50px] leading-[0] left-[960px] not-italic text-[12px] text-black text-center top-[2404px] translate-x-[-50%] w-[1920px]">
        <p className="leading-[50px]">
          <span className="text-[#495060]">版权© 2025 科悦睿博</span>
          <span className="text-[#222222]">{` 渝ICP备2020010377号-5`}</span>
        </p>
      </div>
    </div>
  );
}

function BodyBackgroundColor() {
  return (
    <div className="bg-white h-[2454px] relative shrink-0 w-[1920px]" data-name="Body+BackgroundColor">
      <Container />
    </div>
  );
}

export default function HttpsDoufu100CnViewport1920PxThemeLightGeneratedByCodiaAi() {
  return (
    <div className="bg-[rgba(0,0,0,0)] content-stretch flex flex-col items-start justify-start relative size-full" data-name="https://doufu100.cn/ [Viewport=1920px, Theme=Light] - Generated by Codia AI">
      <BodyBackgroundColor />
    </div>
  );
}