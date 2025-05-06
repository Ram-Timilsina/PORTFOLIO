import Marquee from "react-fast-marquee";
interface icontype {
  name: string;
  imageSrc: string;
}

const AnimatedMarquee = () => {
  const icons: icontype[] = [
    {
      name: "React",
      imageSrc: "/Images/react.svg",
    },
    {
      name: "Next.js",
      imageSrc: "/Images/nextdotjs.svg  ",
    },
    {
      name: "Tailwind CSS",
      imageSrc: "/Images/tailwindcss.svg",
    },
    {
      name: "Node.js",
      imageSrc: "/Images/nodedotjs.svg",
    },
    {
      name: "TypeScript",
      imageSrc: "/Images/typescript.svg",
    },
    {
      name: "JavaScript",
      imageSrc: "/Images/javascript.svg",
    },
  ];
  return (
    <Marquee>
      {icons.map((icon: any) => (
        <div key={icon.name} className="flex items-center mr-8 mt-8 text-2xl">
          <img
            src={icon.imageSrc}
            alt={icon.name}
            className={`w-10 h-10 mr-2 ${
              ["Next.js", "Tailwind CSS","Node.js","TypeScript","JavaScript","React"].includes(icon.name) ? "dark:invert" : ""
            }`}
          />
          <span>{icon.name}</span>
        </div>
      ))}
    </Marquee>
  );
};
export default AnimatedMarquee;
