import Marquee from "react-fast-marquee";
interface icontype {
  name: string;
  imageSrc: string;
}
const AnimatedMarquee = () => {
  const icons: icontype = [
    {
      name: "React",
      imageSrc: "./Images/React-Light.svg",
    },
  ];
  return (
    <Marquee>
      {icons.map((icon: any) => (
        <div key={icon.name} className="flex items-center mr-8">
          <img src={icon.imageSrc} alt={icon.name} className="w-10 h-10 mr-2" />
          <span>{icon.name}</span>
        </div>
      ))}
    </Marquee>
  );
};
export default AnimatedMarquee;
