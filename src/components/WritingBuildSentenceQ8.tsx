import { WritingBuildSentenceBase, WritingBuildSentenceProps } from './WritingBuildSentenceBase';

type WritingBuildSentenceQ8Props = WritingBuildSentenceProps;

export function WritingBuildSentenceQ8(props: WritingBuildSentenceQ8Props) {
  return (
    <WritingBuildSentenceBase
      {...props}
      questionNumber={8}
      slotCount={5}
    />
  );
}
