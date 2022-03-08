
import index from "../pages/index.marko";

export default (req, res) => {
  res.marko(index, {});
};