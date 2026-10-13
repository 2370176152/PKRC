/*
 * @Author: nzgw
 * @Date: 2024-05-10 22:21:45
 * @LastEditors: nzgw
 * @LastEditTime: 2024-05-14 18:00:54
 * @FilePath: \pokerogue\server.cjs
 * @Description:
 *
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved.
 */
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// 设置静态文件目录
app.use(express.static(path.join(__dirname, "dist")));
app.use((req, res, next) => {
  res.on("finish", () => {
    // console.log(res.getHeaders());
  });
  next();
});

// 用于检查文件是否存在的中间件
function checkFileExists(filePath) {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
// 所有请求都发送到 index.html

app.get("*", async (req, res, next) => {
  const filePath = path.join(__dirname, "dist", req.path);
  try {
    const fileExists = await checkFileExists(filePath);
    if (!fileExists) {
      // 如果文件不存在，设置 response.ok 为 false 并返回 404 状态码
      res.json({ ok: false, message: "File not found" });
    } else {
      // 如果文件存在，继续处理请求
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    }
  } catch (error) {
    next(error); // 将错误传递给错误处理中间件
  }
});
app.use((err, req, res, next) => {
  console.error(err.stack); // 输出错误堆栈到控制台
  // 设置适当的 HTTP 状态码，例如 500
  res.status(500).send("Something went wrong!");
});
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
