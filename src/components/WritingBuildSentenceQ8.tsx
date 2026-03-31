import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ8Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ8(props: WritingBuildSentenceQ8Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={8}
      defaultQuestionText="Are you ready for the presentation?"
      defaultWords={['nervous', 'a bit', 'I', 'but', 'am', 'prepared']}
      slotCount={5}
    />
  );
}
