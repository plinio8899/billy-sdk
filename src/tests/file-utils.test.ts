import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mimeType } from "../file-utils.js";

describe("file-utils", () => {
  describe("mimeType", () => {
    it('retorna "image/jpeg" para .jpg', () => {
      assert.equal(mimeType("foto.jpg"), "image/jpeg");
    });

    it('retorna "image/jpeg" para .jpeg', () => {
      assert.equal(mimeType("foto.jpeg"), "image/jpeg");
    });

    it('retorna "image/png" para .png', () => {
      assert.equal(mimeType("foto.png"), "image/png");
    });

    it('retorna "image/gif" para .gif', () => {
      assert.equal(mimeType("foto.gif"), "image/gif");
    });

    it('retorna "image/webp" para .webp', () => {
      assert.equal(mimeType("foto.webp"), "image/webp");
    });

    it('retorna "application/pdf" para .pdf', () => {
      assert.equal(mimeType("doc.pdf"), "application/pdf");
    });

    it('retorna "application/octet-stream" para extension desconocida', () => {
      assert.equal(mimeType("data.csv"), "application/octet-stream");
    });

    it("es case-insensitive con .JPG", () => {
      assert.equal(mimeType("foto.JPG"), "image/jpeg");
    });

    it("maneja rutas con subdirectorios", () => {
      assert.equal(mimeType("./subdir/foto.jpg"), "image/jpeg");
      assert.equal(mimeType("/absoluta/ruta/doc.pdf"), "application/pdf");
    });
  });
});
