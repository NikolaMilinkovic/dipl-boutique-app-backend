import express from "express";
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  console.log("> index route called");
  res.send(":)))");
});

export default router;
