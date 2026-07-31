import { PortableText } from "@portabletext/react";

import Link from "next/link";

const Text = ({ text, typo, className, components }) => {
  if (!Array.isArray(text)) {
    return text ? (
      <p typo={typo} className={className}>
        {text}
      </p>
    ) : null;
  }

  return (
    <div className={className} typo={typo}>
      <PortableText
        value={text}
        components={{
          ...components,
          marks: {
            link: ({ value, children }) => {
              if (!value) return children;

              return <Link link={value}>{children}</Link>;
            },
            ...components?.marks,
          },
        }}
      />
    </div>
  );
};

export default Text;
