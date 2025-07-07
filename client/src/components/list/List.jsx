import "./list.scss";
import Card from "../card/Card";

function List({ posts }) {
  if (!posts || !Array.isArray(posts)) {
    return <div>No posts available.</div>;
  }
  return (
    <div className="list">
      {posts.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </div>
  );
}

export default List;
