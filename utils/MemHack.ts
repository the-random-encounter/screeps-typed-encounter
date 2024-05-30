interface MemHackConst {
  memory: any | null;
  parseTime: number;
  register(): void;
  pretick(): void;
}

export const MemHack: MemHackConst = {
  memory: null,
  parseTime: -1,
  register () {
    const start: number = Game.cpu.getUsed()
    this.memory = Memory
    const end: number = Game.cpu.getUsed()
    this.parseTime = end - start
    this.memory = RawMemory._parsed
  },
  pretick () {
    delete global.Memory
    global.Memory = this.memory
    RawMemory._parsed = this.memory
  }
}
MemHack.register()
export default MemHack
