import { cn } from "@/lib/utils"

describe("cn", () => {
  it("returns a single class unchanged", () => {
    expect(cn("p-4")).toBe("p-4")
  })

  it("joins multiple classes with a space", () => {
    expect(cn("p-4", "text-sm")).toBe("p-4 text-sm")
  })

  it("omits falsy conditional values", () => {
    expect(cn("p-4", false && "text-red-500")).toBe("p-4")
    expect(cn("p-4", null)).toBe("p-4")
    expect(cn("p-4", undefined)).toBe("p-4")
    expect(cn("p-4", 0 as unknown as string)).toBe("p-4")
  })

  it("includes truthy conditional values", () => {
    expect(cn("p-4", true && "text-sm")).toBe("p-4 text-sm")
  })

  it("handles object input — includes keys with truthy values", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500")
  })

  it("handles array input", () => {
    expect(cn(["p-4", "text-sm"])).toBe("p-4 text-sm")
  })

  it("deduplicates conflicting Tailwind classes (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })

  it("deduplicates conflicting classes within an array", () => {
    expect(cn(["p-4", "p-2"])).toBe("p-2")
  })

  it("handles mixed array and object inputs", () => {
    expect(cn(["p-4"], { "text-sm": true })).toBe("p-4 text-sm")
  })

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("")
  })
})
