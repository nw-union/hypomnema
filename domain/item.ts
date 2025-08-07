export type Item = {
  id: string;
  symbol: "dot" | "therefore" | "equal" | "notEqual";
  text: string;
  children: Item[];
  isExpanded: boolean;
};
