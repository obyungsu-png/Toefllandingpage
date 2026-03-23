import React, { useState } from 'react';
import { ResizableReadingLayout } from './ResizableReadingLayout';
import { RadioOption } from './RadioOption';
import { VolumeControl, useVolumeControl } from './VolumeControl';
import { MobileQuestionNav } from './MobileQuestionNav';

// ============================================================================
// Reading Module 2 - All Screens Wrapper
// Manages internal navigation: FillBlanks (Q1-10) -> Q11 -> ... -> Q20
// ============================================================================

export type ReadingM2Screen =
  | 'fillBlanks'
  | 'q11' | 'q12' | 'q13' | 'q14' | 'q15'
  | 'q16' | 'q17' | 'q18' | 'q19' | 'q20';

const SCREEN_ORDER: ReadingM2Screen[] = [
  'fillBlanks',
  'q11', 'q12', 'q13', 'q14', 'q15',
  'q16', 'q17', 'q18', 'q19', 'q20',
];

interface ReadingM2WrapperProps {
  initialScreen: ReadingM2Screen;
  onHome: () => void;
  onComplete: () => void;
}

// Shared header for Q11-Q20 screens
function QuestionHeader({
  onHome,
  onBack,
  onNext,
  nextLabel,
  volumeButtonRef,
  toggleVolume,
}: {
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  volumeButtonRef: React.RefObject<HTMLElement>;
  toggleVolume: () => void;
}) {
  return (
    <div className="bg-[#1e6b73] h-12 sm:h-14 md:h-16 flex items-center justify-between px-2 sm:px-3 md:px-8 shadow-lg">
      <div className="flex items-center min-w-0 shrink">
        <div
          className="text-white text-base sm:text-lg md:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity truncate"
          onClick={onHome}
        >
          *toefl ibt
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
        <button ref={volumeButtonRef as React.RefObject<HTMLButtonElement>} onClick={toggleVolume} className="flex items-center gap-1 sm:gap-1.5 md:gap-3 bg-[#0A6068] border border-white rounded-lg px-2 sm:px-3 md:px-5 py-1 sm:py-1.5 md:py-2 hover:bg-[#084d52] transition-colors">
          <span className="text-white font-['Inter',_sans-serif] font-semibold text-sm hidden sm:inline">Volume</span>
          <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="white">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </button>
        <button
          className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-[#0A6068] border border-white rounded-lg px-2 sm:px-3 md:px-5 py-1 sm:py-1.5 md:py-2 hover:bg-[#084d52] transition-colors"
          onClick={onBack}
        >
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="white">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
          <span className="text-white font-['Inter',_sans-serif] font-semibold text-sm hidden sm:inline">Back</span>
        </button>
        <button
          className="flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-2 sm:px-3 md:px-5 py-1 sm:py-1.5 md:py-2 hover:bg-gray-100 transition-colors"
          onClick={onNext}
        >
          <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm">{nextLabel || 'Next'}</span>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0A6068">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function QuestionTabs({ questionNum }: { questionNum: string }) {
  return (
    <div className="bg-white border-b border-gray-300">
      <div className="px-3 md:px-8 py-3">
        <div className="flex gap-4 md:gap-8">
          <div className="text-gray-700 font-['Inter',_sans-serif] font-bold border-b-2 border-[#1e6b73] pb-2">
            Reading
          </div>
          <div className="text-gray-500 text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">
            Question {questionNum} of 20
          </div>
        </div>
      </div>
    </div>
  );
}

// Email passage content for Q11-Q12 (Art Workshop)
function ArtWorkshopEmail() {
  return (
    <div className="relative w-full">
      <div className="border-2 md:border-4 border-[#1e6b73] rounded-lg overflow-hidden bg-white">
        <div className="bg-white">
          <div className="flex border-b-2 border-[#1e6b73]">
            <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">To:</div>
            <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">edward56L@dmail.com</div>
          </div>
          <div className="flex border-b-2 border-[#1e6b73]">
            <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">From:</div>
            <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">artforeveryone@dmail.com</div>
          </div>
          <div className="flex border-b-2 border-[#1e6b73]">
            <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">Date:</div>
            <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">10/09/2025</div>
          </div>
          <div className="flex border-b-2 border-[#1e6b73]">
            <div className="bg-[#1e6b73] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">Subject:</div>
            <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">Art Workshop Reservation Confirmation</div>
          </div>
        </div>
        <div className="p-3 sm:p-6 bg-white border-2 sm:border-4 border-[#1e6b73] m-1 sm:m-2 max-h-[400px] overflow-y-auto">
          <p className="font-['Inter',_sans-serif] mb-4 text-sm sm:text-base">Dear Ms. Edwards,</p>
          <p className="font-['Inter',_sans-serif] mb-4 text-sm sm:text-base">
            The reservation for the art workshop that you made on September 10th has been confirmed. The workshop will take place on September 20th at 3:00 PM. All necessary arts supplies will be provided, but please bring your own apron or smock.
          </p>
          <p className="font-['Inter',_sans-serif] mb-4 text-sm sm:text-base">Best regards,</p>
          <p className="font-['Inter',_sans-serif] text-sm sm:text-base">Laura Bennett</p>
        </div>
      </div>
    </div>
  );
}

// Email passage content for Q13-Q15 (Grand Opening)
function GrandOpeningEmail() {
  return (
    <div className="relative w-full">
      <div className="border-2 md:border-4 border-[#9d5a2f] rounded-lg overflow-hidden bg-white">
        <div className="bg-white">
          <div className="flex border-b-2 border-[#9d5a2f]">
            <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">To:</div>
            <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">nguyenbooklover@dmail.com</div>
          </div>
          <div className="flex border-b-2 border-[#9d5a2f]">
            <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">From:</div>
            <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">part.gymworkers@dmail.com</div>
          </div>
          <div className="flex border-b-2 border-[#9d5a2f]">
            <div className="bg-[#9d5a2f] text-white font-['Inter',_sans-serif] font-bold px-2 sm:px-4 py-2 w-16 sm:w-24 text-sm sm:text-base">Subject:</div>
            <div className="flex-1 bg-white px-2 sm:px-4 py-2 font-['Inter',_sans-serif] text-sm sm:text-base">You're Invited – Bring Friends & Family to Our Grand Opening!</div>
          </div>
        </div>
        <div className="p-3 md:p-5 bg-white border-2 md:border-4 border-[#9d5a2f] m-1 md:m-2 max-h-[450px] overflow-y-auto text-sm sm:text-base">
          <p className="font-['Inter',_sans-serif] mb-3">Dear Ms. Nguyen,</p>
          <p className="font-['Inter',_sans-serif] mb-3">
            We're excited to invite you—and your friends and family—to the grand opening of our new branch at 25 Orchid Street, happening next Monday. This event is a great opportunity to explore our state-of-the-art facility, featuring top-tier equipment, energizing group classes, and expert personal training.
          </p>
          <p className="font-['Inter',_sans-serif] mb-3">
            This celebration, exclusively for our valued members and their guests, will include guided tours, live fitness demonstrations, and complimentary refreshments. It's the perfect chance to experience our community-focused approach to wellness and introduce others to a space designed for all fitness levels.
          </p>
          <p className="font-['Inter',_sans-serif] mb-3">
            Bring your friends and family! We're offering a special one-day-only discount on memberships for all attendees.
          </p>
          <p className="font-['Inter',_sans-serif] mb-3">
            For questions or to RSVP, contact our customer service team at 555-1234.
          </p>
          <p className="font-['Inter',_sans-serif] mb-2">Warm regards,</p>
          <p className="font-['Inter',_sans-serif]">John Parker</p>
        </div>
      </div>
    </div>
  );
}

// Academic passage for Q16-Q20
function ParadoxOfChoicePassage({ highlightCurating }: { highlightCurating?: boolean }) {
  return (
    <>
      <div className="space-y-2 md:space-y-3 lg:space-y-4 text-black font-['Inter',_sans-serif] leading-relaxed text-sm sm:text-sm md:text-base lg:text-lg">
        <p>
          The paradox of choice, a concept popularized by psychologist Barry Schwartz, suggests that more options can lead to less satisfaction. While the freedom to choose is fundamental to consumer culture, an overabundance of choices—from groceries to electronics—can overwhelm individuals, causing anxiety and decision fatigue. This paradox implies that the vast array of possibilities available today might actually diminish consumer contentment, as the fear of making the wrong choice looms large.
        </p>
        <p>
          Research supports this notion. In an experiment, psychologist Sheena Iyengar found that shoppers were more likely to purchase jam when offered 6 varieties instead of 24. The limited selection eased the decision process, reducing the pressure to find the 'perfect' option and making the experience more enjoyable. This phenomenon reveals that fewer choices can sometimes make consumers happier, which is a valuable insight for marketers and retailers aiming to boost satisfaction by {highlightCurating ? <span className="bg-[#2D9DA7] text-white px-1">curating</span> : 'curating'} their offerings.
        </p>
        <p>
          The paradox also has broader implications. In individualistic cultures, where personal choice is highly valued, the burden of decision-making can be significant. Conversely, collectivist cultures, which often provide fewer choices, report higher levels of contentment. This dynamic suggests that understanding cultural differences in consumer psychology can help businesses optimize their product strategies and enhance overall well-being.
        </p>
      </div>
    </>
  );
}

// ============================================================================
// Main Wrapper Component
// ============================================================================
export function ReadingM2Wrapper({ initialScreen, onHome, onComplete }: ReadingM2WrapperProps) {
  const [currentScreen, setCurrentScreen] = useState<ReadingM2Screen>(initialScreen);
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();

  const goTo = (screen: ReadingM2Screen) => setCurrentScreen(screen);

  const currentIndex = SCREEN_ORDER.indexOf(currentScreen);
  const goPrev = () => {
    if (currentIndex > 0) setCurrentScreen(SCREEN_ORDER[currentIndex - 1]);
  };
  const goNext = () => {
    if (currentIndex < SCREEN_ORDER.length - 1) {
      setCurrentScreen(SCREEN_ORDER[currentIndex + 1]);
    } else {
      onComplete();
    }
  };

  return (
    <>
      {currentScreen === 'fillBlanks' && (
        <FillBlanksScreen onHome={onHome} onBack={onHome} onNext={() => goTo('q11')} />
      )}
      {currentScreen === 'q11' && (
        <EmailQuestionScreen
          questionNum="11"
          questionText="When is the date of the art workshop?"
          answerOptions={["September 10th", "September 12th", "September 20th", "September 30th"]}
          emailType="art"
          passageSummary={<><strong>Art Workshop Reservation Confirmation</strong><br/>From: artforeveryone@dmail.com</>}
          questionInfo="1/2"
          onHome={onHome}
          onBack={() => goTo('fillBlanks')}
          onNext={() => goTo('q12')}
          volumeButtonRef={volumeButtonRef}
          toggleVolume={toggleVolume}
        />
      )}
      {currentScreen === 'q12' && (
        <EmailQuestionScreen
          questionNum="12"
          questionText="What should Ms. Edwards bring to the workshop?"
          answerOptions={["A payment method", "Extra paint", "A protective garment", "Proof of reservation"]}
          emailType="art"
          passageSummary={<><strong>Art Workshop Reservation Confirmation</strong><br/>From: artforeveryone@dmail.com</>}
          questionInfo="2/2"
          onHome={onHome}
          onBack={() => goTo('q11')}
          onNext={() => goTo('q13')}
          volumeButtonRef={volumeButtonRef}
          toggleVolume={toggleVolume}
        />
      )}
      {currentScreen === 'q13' && (
        <EmailQuestionScreen
          questionNum="13"
          questionText="What is the main purpose of the email?"
          answerOptions={[
            "To attract customers to a new fitness center",
            "To provide Ms. Nguyen with an opportunity to provide expert personal training",
            "To celebrate Ms. Nguyen's achievements in wellness",
            "To announce a discount available to fitness-center members"
          ]}
          emailType="gym"
          passageSummary={<><strong>Grand Opening Invitation</strong><br/>From: part.gymworkers@dmail.com</>}
          questionInfo="1/3"
          onHome={onHome}
          onBack={() => goTo('q12')}
          onNext={() => goTo('q14')}
          volumeButtonRef={volumeButtonRef}
          toggleVolume={toggleVolume}
        />
      )}
      {currentScreen === 'q14' && (
        <EmailQuestionScreen
          questionNum="14"
          questionText="What can be inferred about Ms. Nguyen's relationship with the fitness center?"
          answerOptions={[
            "She helps the fitness center to organize activities.",
            "She has already explored the new facility.",
            "She is a member at one of the fitness center's other locations.",
            "She is new to using fitness centers and exercise equipment."
          ]}
          emailType="gym"
          passageSummary={<><strong>Grand Opening Invitation</strong><br/>From: part.gymworkers@dmail.com</>}
          questionInfo="2/3"
          onHome={onHome}
          onBack={() => goTo('q13')}
          onNext={() => goTo('q15')}
          volumeButtonRef={volumeButtonRef}
          toggleVolume={toggleVolume}
        />
      )}
      {currentScreen === 'q15' && (
        <EmailQuestionScreen
          questionNum="15"
          questionText="Why do customers go to the bakery stall early?"
          answerOptions={[
            "To get the free samples given in mornings",
            "To get freshly baked bread and pastries before they are gone",
            "To meet the famous baker",
            "To take advantage of early morning discounts"
          ]}
          emailType="gym"
          passageSummary={<><strong>Grand Opening Invitation</strong><br/>From: part.gymworkers@dmail.com</>}
          questionInfo="3/3"
          onHome={onHome}
          onBack={() => goTo('q14')}
          onNext={() => goTo('q16')}
          volumeButtonRef={volumeButtonRef}
          toggleVolume={toggleVolume}
        />
      )}
      {currentScreen === 'q16' && (
        <AcademicQuestionScreen
          questionNum="16"
          questionText="Which of the following best states a main idea of the passage?"
          answerOptions={[
            "Effective marketing strategies focus on increasing product options.",
            "Modern consumer culture is driven by a demand for fewer products.",
            "Individualism enhances consumer contentment.",
            "Limiting consumer choices can lead to higher satisfaction."
          ]}
          questionInfo="1/5"
          onHome={onHome}
          onBack={() => goTo('q15')}
          onNext={() => goTo('q17')}
          volumeButtonRef={volumeButtonRef}
          toggleVolume={toggleVolume}
        />
      )}
      {currentScreen === 'q17' && (
        <AcademicQuestionScreen
          questionNum="17"
          questionText="What is one effect of decision fatigue as mentioned in the passage?"
          answerOptions={[
            "Desire to make the same choices as other consumers",
            "Anxiety about making the wrong choice",
            "Preference for consumer cultures",
            "Enhanced freedom to choose"
          ]}
          questionInfo="2/5"
          onHome={onHome}
          onBack={() => goTo('q16')}
          onNext={() => goTo('q18')}
          volumeButtonRef={volumeButtonRef}
          toggleVolume={toggleVolume}
        />
      )}
      {currentScreen === 'q18' && (
        <AcademicQuestionScreen
          questionNum="18"
          questionText="Why does the author mention Sheena Iyengar's experiment?"
          answerOptions={[
            "To highlight the effectiveness of marketing strategies",
            "To explain the methodology used in consumer psychology",
            "To provide evidence supporting the paradox of choice",
            "To criticize the abundance of products in modern markets"
          ]}
          questionInfo="3/5"
          onHome={onHome}
          onBack={() => goTo('q17')}
          onNext={() => goTo('q19')}
          volumeButtonRef={volumeButtonRef}
          toggleVolume={toggleVolume}
        />
      )}
      {currentScreen === 'q19' && (
        <AcademicQuestionScreen
          questionNum="19"
          questionText={'The word "curating" in the passage is closest in meaning to'}
          answerOptions={["eliminating", "organizing", "increasing", "changing"]}
          questionInfo="4/5"
          highlightCurating
          onHome={onHome}
          onBack={() => goTo('q18')}
          onNext={() => goTo('q20')}
          volumeButtonRef={volumeButtonRef}
          toggleVolume={toggleVolume}
        />
      )}
      {currentScreen === 'q20' && (
        <AcademicQuestionScreen
          questionNum="20"
          questionText="What does the passage suggest about collectivist cultures?"
          answerOptions={[
            "They tend to report lower levels of satisfaction.",
            "They are more affected by the paradox of choice.",
            "They generally have fewer choices available.",
            "They prefer individual decision-making."
          ]}
          questionInfo="5/5"
          nextLabel="Submit"
          onHome={onHome}
          onBack={() => goTo('q19')}
          onNext={onComplete}
          volumeButtonRef={volumeButtonRef}
          toggleVolume={toggleVolume}
        />
      )}
      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
    </>
  );
}

// ============================================================================
// Email Question Screen (Q11-Q15)
// ============================================================================
function EmailQuestionScreen({
  questionNum,
  questionText,
  answerOptions,
  emailType,
  passageSummary,
  questionInfo,
  onHome,
  onBack,
  onNext,
  volumeButtonRef,
  toggleVolume,
}: {
  questionNum: string;
  questionText: string;
  answerOptions: string[];
  emailType: 'art' | 'gym';
  passageSummary: React.ReactNode;
  questionInfo: string;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
  volumeButtonRef: React.RefObject<HTMLElement>;
  toggleVolume: () => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <QuestionHeader onHome={onHome} onBack={onBack} onNext={onNext} volumeButtonRef={volumeButtonRef} toggleVolume={toggleVolume} />
      <QuestionTabs questionNum={questionNum} />

      <div className="flex-1 overflow-auto bg-white border border-black pb-16 md:pb-0">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-3 md:py-6 lg:py-8 text-center">Read an email.</h1>

        <ResizableReadingLayout
          passageTitle="Read an email."
          passageSummary={passageSummary}
          questionInfo={questionInfo}
          onBack={onBack}
          onPrev={onBack}
          onNext={onNext}
          onSubmit={onNext}
          leftContent={emailType === 'art' ? <ArtWorkshopEmail /> : <GrandOpeningEmail />}
          rightContent={
            <>
              <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">{questionText}</h3>
              <div className="space-y-3 md:space-y-4 lg:space-y-6">
                {answerOptions.map((option, index) => (
                  <RadioOption
                    key={index}
                    id={`module2-q${questionNum}-option-${index}`}
                    name={`module2-q${questionNum}`}
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={() => setSelectedAnswer(option)}
                    label={option}
                    size="sm"
                  />
                ))}
              </div>
            </>
          }
        />
      </div>
      
      <MobileQuestionNav onBack={onBack} onHome={onHome} onNext={onNext} />
    </div>
  );
}

// ============================================================================
// Academic Question Screen (Q16-Q20 - Paradox of Choice)
// ============================================================================
function AcademicQuestionScreen({
  questionNum,
  questionText,
  answerOptions,
  questionInfo,
  highlightCurating,
  nextLabel,
  onHome,
  onBack,
  onNext,
  volumeButtonRef,
  toggleVolume,
}: {
  questionNum: string;
  questionText: string;
  answerOptions: string[];
  questionInfo: string;
  highlightCurating?: boolean;
  nextLabel?: string;
  onHome: () => void;
  onBack: () => void;
  onNext: () => void;
  volumeButtonRef: React.RefObject<HTMLElement>;
  toggleVolume: () => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2));
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <QuestionHeader onHome={onHome} onBack={onBack} onNext={onNext} nextLabel={nextLabel} volumeButtonRef={volumeButtonRef} toggleVolume={toggleVolume} />
      <QuestionTabs questionNum={questionNum} />

      <div className="flex-1 overflow-auto bg-white border border-black pb-16 md:pb-0">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-['Inter',_sans-serif] font-bold text-black py-3 md:py-6 lg:py-8 text-center">The Paradox of Choice</h1>
        <ResizableReadingLayout
          zoom={zoom}
          onWheel={handleWheel}
          passageTitle="The Paradox of Choice"
          passageSummary={<><strong>The Paradox of Choice</strong><br/>More options can lead to less satisfaction.</>}
          questionInfo={questionInfo}
          onBack={onBack}
          onPrev={onBack}
          onNext={onNext}
          onSubmit={onNext}
          leftContent={<ParadoxOfChoicePassage highlightCurating={highlightCurating} />}
          rightContent={
            <>
              <h3 className="text-base sm:text-lg md:text-xl font-['Inter',_sans-serif] font-bold text-black mb-4 md:mb-8 lg:mb-10">{questionText}</h3>
              <div className="space-y-3 md:space-y-4 lg:space-y-6">
                {answerOptions.map((option, index) => (
                  <RadioOption
                    key={index}
                    id={`module2-q${questionNum}-option-${index}`}
                    name={`module2-q${questionNum}`}
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={() => setSelectedAnswer(option)}
                    label={option}
                    size="sm"
                  />
                ))}
              </div>
            </>
          }
        />
      </div>
      
      <MobileQuestionNav onBack={onBack} onHome={onHome} onNext={onNext} nextLabel={nextLabel} />
    </div>
  );
}

// ============================================================================
// Fill in the Blanks Screen (Q1-10)
// ============================================================================
function FillBlanksScreen({ onHome, onBack, onNext }: { onHome: () => void; onBack: () => void; onNext: () => void }) {
  const [m2InputValues, setM2InputValues] = React.useState<Record<number, string>>({});
  const [m2FilledInputs, setM2FilledInputs] = React.useState<Record<number, boolean>>({});
  const { isOpen: isVolumeOpen, buttonRef: volumeButtonRef, toggleVolume, closeVolume } = useVolumeControl();

  const CHAR_UNIT_WIDTH = 20;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const m2Inputs = [
    { id: 0, maxLength: 1 },
    { id: 1, maxLength: 2 },
    { id: 2, maxLength: 4 },
    { id: 3, maxLength: 2 },
    { id: 4, maxLength: 3 },
    { id: 5, maxLength: 2 },
    { id: 6, maxLength: 2 },
    { id: 7, maxLength: 4 },
    { id: 8, maxLength: 5 },
    { id: 9, maxLength: 2 },
  ];

  const handleInputChange = (id: number, value: string) => {
    setM2InputValues(prev => ({ ...prev, [id]: value }));
    if (value.length >= m2Inputs[id].maxLength) {
      setM2FilledInputs(prev => ({ ...prev, [id]: true }));
    } else {
      setM2FilledInputs(prev => ({ ...prev, [id]: false }));
    }
    if (value.length === m2Inputs[id].maxLength) {
      const nextId = id + 1;
      if (nextId < m2Inputs.length) {
        setTimeout(() => {
          const nextInput = document.querySelector(`input[data-input-id="m2-${nextId}"]`) as HTMLInputElement;
          if (nextInput) nextInput.focus();
        }, 0);
      }
    }
  };

  const handleFocus = (id: number) => {
    const value = m2InputValues[id] || '';
    if (value.length < m2Inputs[id].maxLength) {
      setM2FilledInputs(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleBlur = (id: number) => {
    if (m2InputValues[id] && m2InputValues[id].length > 0) {
      setM2FilledInputs(prev => ({ ...prev, [id]: true }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const getTextWidth = (text: string): number => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return text.length * 14;
    context.font = "1.25rem 'Inter', sans-serif";
    const metrics = context.measureText(text);
    return Math.ceil(metrics.width) + 4;
  };

  const getInputWidth = (id: number): string => {
    const value = m2InputValues[id] || '';
    const maxLen = m2Inputs[id].maxLength;
    if (value.length >= maxLen) {
      return `${getTextWidth(value)}px`;
    }
    const mobileOffset = isMobile ? CHAR_UNIT_WIDTH : 0;
    return `${maxLen * CHAR_UNIT_WIDTH - mobileOffset}px`;
  };

  const renderInput = (id: number) => (
    <input
      type="text"
      data-input-id={`m2-${id}`}
      className={`m2-gap-input ${m2FilledInputs[id] ? 'filled' : ''}`}
      maxLength={m2Inputs[id].maxLength}
      value={m2InputValues[id] || ''}
      onChange={(e) => handleInputChange(id, e.target.value)}
      onFocus={() => handleFocus(id)}
      onBlur={() => handleBlur(id)}
      onKeyPress={(e) => handleKeyPress(e, id)}
      style={{ width: getInputWidth(id) }}
    />
  );

  return (
    <div className="fixed inset-0 bg-[#b0b0b0] z-50 flex flex-col">
      <div className="flex-1 flex flex-col px-1 sm:px-4 md:px-6 overflow-auto">
        {/* Header */}
        <div className="bg-[#1e6b73] h-12 sm:h-14 flex items-center justify-between px-3 sm:px-8 shrink-0 relative">
          <div className="flex items-center min-w-0 shrink">
            <div
              className="text-white text-lg sm:text-2xl font-['Inter',_sans-serif] font-bold tracking-wide cursor-pointer hover:opacity-80 transition-opacity truncate"
              onClick={onHome}
            >
              *toefl ibt
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              ref={volumeButtonRef as React.RefObject<HTMLButtonElement>}
              className={`flex items-center gap-1.5 sm:gap-3 border rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 transition-colors ${
                isVolumeOpen
                  ? 'bg-white border-white text-[#1e6b73]'
                  : 'bg-[#0A6068] border-white text-white hover:bg-[#084d52]'
              }`}
              onClick={toggleVolume}
            >
              <span className="font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Volume</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill={isVolumeOpen ? '#1e6b73' : 'white'}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            <button
              className="flex items-center gap-1.5 sm:gap-2 bg-[#0A6068] border border-white rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-[#084d52] transition-colors"
              onClick={onBack}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="white">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-white font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Back</span>
            </button>
            <button
              className="flex items-center gap-1.5 sm:gap-2 bg-white border-2 border-[#0A6068] rounded-lg px-3 sm:px-5 py-1.5 sm:py-2 hover:bg-gray-100 transition-colors"
              onClick={onNext}
            >
              <span className="text-[#0A6068] font-['Inter',_sans-serif] font-semibold text-sm sm:text-base">Next</span>
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="#0A6068">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="bg-white border-b border-gray-300 shrink-0">
          <div className="px-3 sm:px-8 py-2 sm:py-3">
            <div className="flex gap-4 sm:gap-8">
              <div className="text-gray-700 font-['Inter',_sans-serif] text-sm sm:text-base font-bold border-b-2 border-[#1e6b73] pb-2">Reading</div>
              <div className="text-gray-500 text-xs sm:text-sm font-['Inter',_sans-serif] font-medium self-end pb-2">Question 1-10</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 bg-white overflow-auto">
          <div className="p-4 sm:p-5 md:p-12 pt-8 sm:pt-16 md:pt-24 flex flex-col items-center">
            <h1 className="mb-10 sm:mb-12 md:mb-14 text-xl sm:text-2xl md:text-[1.75rem] text-black font-bold font-['Inter',_sans-serif] text-center px-2">
              Fill in the missing letters in the paragraph.
            </h1>

            <div className="max-w-[900px] w-full text-lg sm:text-lg md:text-[1.25rem] leading-[1.8] sm:leading-relaxed md:leading-[1.8] text-black font-['Inter',_sans-serif] px-1 sm:px-4" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              The human brain is a complex organ responsible for controlling all bodily functions and enabling thought, emotion, and memory. It i{renderInput(0)} divided in{renderInput(1)} several reg{renderInput(2)}, each wi{renderInput(3)} specific ro{renderInput(4)}. The cerebrum, i{renderInput(5)} largest pa{renderInput(6)}, is invo{renderInput(7)} in higher cogn{renderInput(8)} functions su{renderInput(9)} as reasoning, planning, and language. The cerebellum coordinates movement and balance, while the brainstem controls vital bodily functions like breathing and heart rate. Together, they enable the brain to perform its various tasks.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .m2-gap-input {
          display: inline-block;
          background-color: #d8d8d8;
          border: none;
          border-radius: 3px;
          background-image: linear-gradient(to right, #333 0%, #333 60%, transparent 60%, transparent 100%);
          background-size: 20px 2px;
          background-position: left bottom 3px;
          background-repeat: repeat-x;
          font-family: inherit;
          color: #000000;
          padding: 0 2px;
          margin: 0 1px;
          outline: none;
          text-align: left;
          font-weight: inherit;
          font-size: inherit;
          letter-spacing: 4px;
          height: 1.6em;
          vertical-align: baseline;
          transition: width 0.2s ease, background-color 0.2s;
          box-sizing: border-box;
          line-height: inherit;
          min-width: 20px;
        }

        .m2-gap-input.filled {
          background-image: none;
          background-color: #d8d8d8;
          font-weight: inherit;
          font-size: inherit;
          letter-spacing: normal;
          text-align: left;
          padding: 0 2px;
          margin: 0 1px;
          border-radius: 3px;
          cursor: pointer;
          box-sizing: border-box;
          color: #000000;
          line-height: inherit;
          min-width: 0;
        }

        .m2-gap-input:focus {
          background-color: #ccc;
        }

        .m2-gap-input::selection {
          background: #888;
          color: white;
        }

        @media (max-width: 640px) {
          .m2-gap-input {
            letter-spacing: 3px;
            height: 1.5em;
            padding: 0 1px;
            margin: 0 0.5px;
            background-size: 16px 1.5px;
            background-position: left bottom 2px;
          }
          .m2-gap-input.filled {
            letter-spacing: normal;
            padding: 0 1px;
            margin: 0 0.5px;
          }
        }
      `}</style>

      <VolumeControl isOpen={isVolumeOpen} onClose={closeVolume} buttonRef={volumeButtonRef} />
    </div>
  );
}