// PURPOSE import creep role modules
import { roleHarvester, roleUpgrader, roleBuilder, roleFiller, roleRepairer, roleRunner, roleCrane, roleMiner, roleScientist, roleRanger, roleWarrior, roleHealer, roleProvider, roleRebooter, roleRemoteLogistician, roleRemoteHarvester, roleRemoteBuilder, roleRemoteGuard, roleReserver, roleClaimer, roleScout, roleInvader, roleCollector } from "roles/roles";

// PURPOSE import other modules
import { roomDefense } from "./roomDefense";
import { calcTickTime, visualRCProgress, buildProgress, log } from 'prototypes/miscFunctions';
import { ErrorMapper } from "utils/ErrorMapper";
import { MemHack } from "utils/MemHack";

// PURPOSE import prototype modules
import 'prototypes/creepFunctions';
import 'prototypes/roomFunctions';
import 'prototypes/roomPositionFunctions';
import 'prototypes/spawnFunctions';

// PURPOSE start of TypeScript interface & type declarations
declare global {

  // PURPOSE begin with TYPE definitions
  type alignment = 'left' | 'right' | 'center';

  type OrderedStructurePlans = BuildObj[];

  type CreepRoles =
    'builder'           |
    'claimer'           |
    'filler'            |
    'collector'         |
    'crane'             |
    'harvester'         |
    'healer'            |
    'invader'           |
    'miner'             |
    'provider'          |
    'ranger'            |
    'rebooter'          |
    'remotebuilder'     |
    'remoteguard'       |
    'remoteharvester'   |
    'remotelogistician' |
    'remoterunner'      |
    'repairer'          |
    'reserver'          |
    'runner'            |
    'scientist'         |
    'scout'             |
    'upgrader'          |
    'warrior'           |
    'unallocated'


  type RoomObjectName =
    'terrainCM'         |
    'baseCM'            |
    'roadCM'            |
    'strucutrePlans'    |
    'mineral'           |
    'source1'           |
    'source2'           |
    'sources'           |
    'structuresByType'  |
    'cSitesByType'      |
    StructureConstant   |
    `${StructureConstant}CSite`   |
    'enemyCSites'                 |
    'allyCSites'                  |
    'mineralHarvestPositions'     |
    'closestMineralHarvestPos'    |
    'source1HarvestPositions'     |
    'source1closestHarvestPos'    |
    'source2HarvestPositions'     |
    'source2ClosestHarvestPos'    |
    'centerUpgraderPos'           |
    'upgradePositions'            |
    'fastFillerPositions'         |
    'source1Container'            |
    'source2Container'            |
    'controllerContainer'         |
    'mineralContainer'            |
    'fastFillerContainerLeft'     |
    'fastFillerContainerRight'    |
    'labContainer'                |
    'source1Link'                 |
    'source2Link'                 |
    'fastFillerLink'              |
    'hubLink'                     |
    'controllerLink'              |
    'usedMienralHarvestPositions' |
    'usedSourceHarvestPositions'  |
    'usedUpgradePositions'        |
    'usedFastFillerPositions'     |
    'structuresForSpawning'       |
    'notMyCreeps'                 |
    'enemyCreeps'                 |
    'allyCreeps'                  |
    'myDamagedCreeps'             |
    'damagedAllyCreeps'           |
    'remoteNamesByEfficacy'

  type RoomTaskTypes =
    'pull'      |
    'withdraw'  |
    'transfer'  |
    'pickup'    |
    'offer'

  type LogisticsPair = {
    source:       Id<StructureContainer | StructureStorage>;
    destination:  Id<StructureContainer | StructureStorage | StructureLink>;
    resource:     ResourceConstant;
    locality:     'local' | 'remote',
    descriptor:   string,
    distance?:    number,
  }

  type RoomFlag =
    'centralStorageLogic'   |
    'closestConSites'       |
    'craneUpgrades'         |
    'harvestersFixAdjacent' |
    'runnersDoMinerals'     |
    'runnersDoPiles'        |
    'repairBasics'          |
    'repairRamparts'        |
    'repairWalls'           |
    'sortConSites'          |
    'towerRepairBasic'      |
    'towerRepairDefenses'   |
    'upgradersSeekEnergy'   |
    'doScience'             |
    'boostCreeps'

  type RoomName = `${'W' | 'E'}${number}${'N' | 'S'}${number}`

  type ReturnCode =
    'OK'                        |
    'ERR_NOT_OWNER'             |
    'ERR_NO_PATH'               |
    'ERR_NAME_EXISTS'           |
    'ERR_BUSY'                  |
    'ERR_NOT_FOUND'             |
    'ERR_NOT_ENOUGH_RESOURCES'  |
    'ERR_INVALID_TARGET'        |
    'ERR_FULL'                  |
    'ERR_NOT_IN_RANGE'          |
    'ERR_INVALID_ARGS'          |
    'ERR_TIRED'                 |
    'ERR_NO_BODYPART'           |
    'ERR_RCL_NOT_ENOUGH'        |
    'ERR_GCL_NOT_ENOUGH'

  // PURPOSE Begin TypeScript Interface implementations

  // * INTERFACES FOR IMPLEMENTING ADDITIONAL NATIVE GAME OBJECT PROTOTYPE FUNCTIONS
  interface Creep { // * ADDITIONAL CREEP OBJECT FUNCTIONS & PROPERTIES
    [key: string]:                                    any;
    findEnergySource():                               Source | false;
    AHS(no?: boolean):                                Source;
    assignHarvestSource(noIncrement?: boolean):       Source;
    assignRemoteHarvestSource(noIncrement?: boolean): Source;
    unloadEnergy():                                   void;
    harvestEnergy():                                  void;
    getDroppedResource(pileID: Id<Resource>):         void;
    pickupClosestEnergy():                            void;
    unloadMineral():                                  void;
    harvestMineral():                                 void;
    moveBySerializedPath(serializedPath: string):     void;
    recursivePathMove(serializedPath: string,
                      stepNum: number):               void;
    disable():                                        true;
    enable():                                         false;
    getBoost(compound: MineralCompoundConstant,
            sourceLab: Id<StructureLab>,
            numParts : number):                       boolean;
    assignOutbox(noIncrement?: boolean):              StructureContainer;
    assignInbox(noIncrement?: boolean):               StructureContainer;
    assignLogisticalPair(logParam?: number):          boolean;
    assignLogisticalPair():                           boolean;
    navigateWaypoints(waypoints: string | string[]):  void;
    targetPile(pileID: Id<Resource>):                 void;
  }
  interface Room { // * ADDITIONAL ROOM OBJECT FUNCTIONS
    clearPPT  ():                                     void;
    enableCSL ():                                     void;
    disableCSL():                                     void;
    toggleCSL ():                                     void;
    setAttackRoom(roomName: string):                  void;
    setCustomAttackTarget(
      attackTarget: Id<Structure>):                   void;
    getInboxes():                                     Id<StructureContainer>[];
    getOutboxes():                                    Id<StructureContainer>[];
    setQuota(roleTarget:  CreepRoles,
             newTarget:   number    ):                void;
    cacheObjects():                                   void;
    initTargets(array:    number[]  ):                void;
    setTarget(roleTarget: CreepRoles,
              newTarget:  number    ):                void;
    sendEnergy():                                     void;
    initRoom():                                       void;
    initTargets(targetArray?: number[] |
                              false):                 void;
    initFlags():                                      void;
    setRoomFlags(flags: boolean[]):                   void;
    initSettings():                                   void;
    registerLogisticalPairs():                        void;
    setRepairRampartsTo(percentMax:   number  ):      void;
    setRepairWallsTo(percentMax:      number  ):      void;
    setRoomSettings(repairToArray:    number[],
                    labSettingsArray: string[]):      void;
    setInbox(
      boxID: Id<StructureContainer>):                 void;
    setOutbox(
      boxID: Id<StructureContainer>):                 void;
    checkInbox(
      boxID: Id<StructureContainer>):                 boolean;
    checkOutbox(
      boxID: Id<StructureContainer>):                 boolean;
    enableFlag( flag:   string  ,
          initIfNull:   boolean):                     void;
    disableFlag(flag:   string  ,
          initIfNull:   boolean):                     void;
    toggleFlag( flag:   string  ,
          initIfNull:   boolean ,
        defaultValue:   boolean):                     void;
    clearRCLCounter():                                void;
    enableDisplayUpgradeRange():                      true;
    enableBoostCreeps(
      dontScience: boolean):                          void;
    toggleBoostCreeps(
      dontScience: boolean):                          void;
    disableBoostCreeps():                             void;
    enableCentralStorageLogic():                      void;
    enableCraneUpgrades():                            void;
    enableDoScience():                                void;
    enableTowerRepairBasic():                         void;
    enableTowerRepairDefenses():                      void;
    enableRunnersDoMinerals():                        void;
    enableRepairWalls():                              void;
    enableRepairRamparts():                           void;
    disableCentralStorageLogic():                     void;
    disableCraneUpgrades():                           void;
    disableDoScience():                               void;
    disableTowerRepairBasic():                        void;
    disableTowerRepairDefenses():                     void;
    disableRunnersDoMinerals():                       void;
    disableRepairWalls():                             void;
    toggleRunnersDoMinerals():                        void;
    toggleTowerRepairDefenses():                      void;
    toggleTowerRepairBasic():                         void;
    toggleDoScience():                                void;
    toggleCraneUpgrades():                            void;
    toggleCentralStorageLogic():                      void;
    toggleRepairWalls():                              void;
    disableRepairRamparts():                          void;
    toggleRepairRamparts():                           void;
    enableRepairBasics():                             void;
    disableRepairBasics():                            void;
    toggleRepairBasics():                             void;
    enableSortConSites():                             void;
    disableSortConSites():                            void;
    toggleSortConSites():                             void;
    calcLabReaction():                                MineralCompoundConstant;
    setSquad(squadName: string):                      void;
    setMusterPoint(
      squadName: string,
      posArray: number[],
      roomName: RoomName |
                false):                               void;
    registerOutpost(
      roomName: string |
                number):                              boolean;
    registerOutpostContainers(
      outpostName: string):                           void;
    calcOutpostPotential():                           void;
    registerLinks(): void;
    registerInvaderGroup(
      rallyPoint: string |
                  string[],
      targetRoom: RoomName,
      groupSize: number,
      groupRoles: string[]):                          void;
    setCraneSpot(
      posX: number,
      posY: number):                                  void;
    setRemoteTargets(
      roomName: RoomName,
      roomXY: number[],
      waypoints: string   |
                 string[] |
                 false,
      rbCount: number,
      rlCount: number,
      claimRoom: RoomName |
                 false,
      override: boolean):                             void;
    link():                                           void;
    findRemoteLinks():                                void;
    setCombatObjectives(
      attackRoom: RoomName,
      waypoints: string | string[],
      customTarget: Id<AnyStructure> |
                    Id<AnyStructure>[] |
                    false):                           boolean;
    setClaimObjective(
      roomName        : RoomName,
      logSpot         : number[],
      initialEnergy   : number,
      neededHarvester : number,
      neededBuilders  : number,
      waypoints       : string | string[]):           boolean;
  }
  interface RoomPosition { // * ADDITIONAL ROOMPOSITION OBJECT FUNCTIONS
    getNearbyPositions():   Array<RoomPosition>;
    getOpenPositions():     Array<RoomPosition>;
    getNumOpenPositions():  number;
    link():                 string;
  }
  interface StructureSpawn { // * ADDITIONAL SPAWN STRUCTURE OBJECT FUNCTIONS
    spawnCollector(
      name: string,
      waypoints: string | string[] | 'none',
      maxEnergy?: number | false,
      iteration?: number):            ReturnCode;
    spawnHealer(
      creepName : string,
      targetRoom: RoomName,
      waypoints : string | string[] | 'none',
      maxEnergy : number | false):   ReturnCode;
    spawnBeef(
      creepName : string,
      targetRoom: RoomName,
      waypoints : string | string[] | 'none',
      maxEnergy : number | false):   ReturnCode;
    spawnWarrior(
      creepName : string,
      targetRoom: RoomName,
      waypoints : string | string[] | 'none',
      maxEnergy : number | false ):  ReturnCode;
    spawnNewClaimBuilder(
      targetRoom:  RoomName,
      name      :  string,
      maxEnergy?:  number,
      iteration?:  number       ):   ReturnCode;
    spawnNewClaimHarvester(
      targetRoom:  RoomName,
      name      :  string,
      maxEnergy?:  number,
      iteration?:  number       ):   ReturnCode;
    spawnNewClaimHauler(
      targetRoom:  RoomName,
      name      :  string,
      maxEnergy?:  number,
      iteration?:  number       ):   ReturnCode;
    spawnClaimer(
      claimRoom :  RoomName,
      name      :  string,
      canHaul   :  boolean,
      maxEnergy?:  number,
      iteration?:  number       ):   ReturnCode;
    determineBodyparts(
      creepRole:  CreepRoles,
      maxEnergy?: number        ):   BodyPartConstant[];
  }

  // * INTERFACES FOR TOP LEVEL MEMORY OBJECTS (MEMORY, ROOM_MEMORY, CREEP_MEMORY)

  interface RawMemory {
    _parsed: any;
  }
  interface Memory {
    miscData?:          MiscData;
    constructed?:       true | undefined;
    roomVisuals?:       boolean;
    mapVisuals?:        boolean;
    cpuLogging?:        boolean;
    ID?:                number;
    colonies?:          Colonies;
    stats?:             Partial<Stats>;
    claimRequests?:     { [key: string]: { needs: number[], score: number } };
    attackRequests?:    { [key: string]: { needs: number[] } };
    constructionSites?: { [key: string]: number };
    globalSettings?:    { [key: string]: any };
    time?:              { [key: string]: any };
    matrices?:          { [key: string]: any };
  }
  interface CreepMemory {
    role:           CreepRoles;
    roleForQuota:   CreepRoles;
    homeRoom:       RoomName | string;
    working?:       boolean;
    rallyPoint?:    string | string[] | 'none';
    disableAI?:     boolean;
    pickup?:        Id<StructureContainer | StructureStorage | StructureLink>;
    dropoff?:       Id<StructureContainer | StructureStorage | StructureLink>;
    bucket?:        Id<StructureContainer | StructureStorage | StructureLink>;
    source?:        Id<Source>;
    mineral?:       Id<Mineral>;
    cargo?:         ResourceConstant;
    invaderLooter?: boolean;
    [key: string]:  any;
    link?:          Id<StructureLink>;
    atCraneSpot?:   boolean;
    upgrading?:     boolean;
    dropLink?:      boolean;
    storage?:       Id<StructureStorage>;
    terminal?:      Id<StructureTerminal>;
    destination?:   Id<StructureLink>;
    xferDest?:      boolean;
    customTarget?:  Id<AnyStructure>;
    savedPile?:     Id<Resource>;
  }
  interface RoomMemory {
    targets:        { [key: string]: number };
    paths?:         { [key: string]: any };
    data:           RoomData;
    settings:       RoomSettings;
    objects:        RoomObjects;
    outposts:       Outposts;
    outpostOfRoom?: string;
  }

  // * INTERFACES FOR GAME MEMORY SUBOBJECTS
  interface Colonies {
    colonyList?:  string[];
    registry?:    { [key: string]: Colony };
  }
  interface Colony {
    ID?:        number;
    level?:     number;
    roomName?:  string;
    spawns?:    Array<string>;
    exitDirs?:  Array<string>;
    exitRooms?: Array<string>;
    outposts?:  { [key: string]: Outpost };
  }
  interface MiscData {
    [key: string]: any;
    rooms: { [key: string]: any };
  }
  interface GlobalSettings {
    consoleSpawnInterval: number;
    alertDisabled:        boolean;
    reusePathValue:       number;
    ignoreCreeps:         boolean,
    creepSettings: {
        [key: string]: {
        reusePathValue:   number;
        ignoreCreeps:     boolean;
      }
    };
  }

  // * INTERFACES FOR ROOM_MEMORY.SETTINGS OBJECT & SUBOBJECTS
  interface RoomSettings {
    containerSettings:  ContainerSettings;
    labSettings:        LabSettings;
    repairSettings:     RepairSettings;
    visualSettings:     VisualSettings;
    flags:              RoomFlags;
  }
  interface ContainerSettings {
    inboxes?:     Id<StructureContainer>[];
    outboxes?:    Id<StructureContainer>[];
    lastInbox?:   number;
    lastOutbox?:  number;
  }
  interface LabSettings {
    reagentOne?:    MineralConstant | MineralCompoundConstant;
    reagentTwo?:    MineralConstant | MineralCompoundConstant;
    boostCompound?: MineralBoostConstant;
  }
  interface RoomFlags {
    centralStorageLogic?:   boolean;
    closestConSites?:       boolean;
    craneUpgrades?:         boolean;
    displayTowerRanges?:    boolean;
    harvestersFixAdjacent?: boolean;
    runnersDoMinerals?:     boolean;
    runnersDoPiles?:        boolean;
    repairBasics?:          boolean;
    repairRamparts?:        boolean;
    repairWalls?:           boolean;
    sortConSites?:          boolean;
    towerRepairBasic?:      boolean;
    towerRepairDefenses?:   boolean;
    upgradersSeekEnergy?:   boolean;
    doScience?:             boolean;
    boostCreeps?:           boolean;
  }
  interface RepairSettings {
    repairRampartsTo?:  number;
    repairWallsTo?:     number;
  }
  interface VisualSettings {
    spawnInfo?:     SpawnInfoSettings;
    roomFlags?:     RoomFlagsSettings;
    progressInfo?:  ProgressInfoSettings;
    displayControllerUpgradeRange?: boolean;
    displayTowerRanges?:            boolean;
  }
  interface SpawnInfoSettings {
    alignment?: alignment;
    color?:     string;
    fontSize?:  number;
  }
  interface RoomFlagsSettings {
    displayCoords?: number[];
    color?:         string;
    fontSize?:      number;
  }
  interface ProgressInfoSettings {
    alignment?: alignment;
    xOffset?: number;
    yOffsetFactor?: number;
    stroke?: string;
    fontSize?: number;
    color?: string;
  }

  // * INTERFACES FOR ROOM_MEMORY.DATA OBJECT & SUBOBJECTS
  interface RoomData {
    craneSpot?:           number[];
    numCSites?:           number;
    upgraderBucket?:      Id<StructureContainer | StructureStorage | StructureLink>;
    linkRegistry?:        LinkRegistry;
    logisticalPairs?:     LogisticsPair[];
    customAttackTarget?:  Id<AnyStructure>;
    attackRoom?:          RoomName;
    noPairs?:             boolean;
    pairCounter?:         number;
    pairPaths?:           any[];
    remoteWorkRoom?:      RoomName;
    claimRooms?:          { [key: RoomName]: ClaimRoomObjective };
    remoteLogistics?:     { [key: RoomName]: RemoteLogistics };
    squads?:              string[];
    combatObjectives?:    CombatObjective;
    towerLRT?:            Id<AnyStructure>;
    attackSignal?:        boolean;
    controllerAttack?:    Id<StructureController>;
  }
  interface ClaimRoomObjective {
    roomName: RoomName;
    logSpot:  Pos;
    initialEnergy: number;
    energyRemaining: number;
    neededHarvesters: number;
    neededBuilders: number;
    waypoints?: string | string[];
    hasBeenClaimed: boolean;
    claimerSpawned: boolean;
  }
  interface CombatObjective {
    attackRoom?:          RoomName;
    customAttackTargets?: Id<AnyStructure> | Id<AnyStructure>[] | false;
    squads?:              string[];
    waypoints?:           string | string[];
    invaderGroupSize?:    number;
    musterPoint?:         RoomPosition;
  }
  interface RemoteLogistics {
    roomName:                 RoomName;
    desiredBuilderCount:      number;
    desiredLogisticianCount:  number;
    waypoints?:               string | string[];
    logisticsTarget:          number[];
  }
  interface LinkRegistry {
    sourceOne?:     Id<StructureLink>;
    sourceTwo?:     Id<StructureLink>;
    central?:       Id<StructureLink>;
    destination?:   Id<StructureLink>;
    remotes?:       Id<StructureLink>[];
  }
  interface Outposts {
    roomList?:                string[];
    registry?:                { [key: string]: Outpost };
    aggregateSourceList?:     Array<Id<Source>>;
    aggLastAssigned?:         number;
    aggregateContainerList?:  Array<Id<StructureContainer>>;
    aggLastContainer?:        number;
  }
  interface Outpost {
    name:         string;
    homeRoom:     string;
    controller:   Id<StructureController>;
    containers?:  Array<Id<StructureContainer>>;
    sources:      Array<Id<Source>>;
    mineral?:     Id<Mineral>;
    lastAssigned: number;
    direction:    DirectionConstant;
    rallyPoint?:  string | string[];
  }
  interface RoomObjects {
    sources?:       Id<Source>[];
    mineral?:       Id<Mineral>;
    deposit?:       Id<Deposit>;
    controller?:    Id<StructureController>;
    containers?:    Id<StructureContainer>[];
    spawns?:        Id<StructureSpawn>[];
    extensions?:    Id<StructureExtension>[];
    towers?:        Id<StructureTower>[];
    storage?:       Id<StructureStorage>;
    links?:         Id<StructureLink>[];
    extractor?:     Id<StructureExtractor>;
    terminal?:      Id<StructureTerminal>;
    labs?:          Id<StructureLab>[];
    factory?:       Id<StructureFactory>;
    observer?:      Id<StructureObserver>;
    nuker?:         Id<StructureNuker>;
    powerSpawn?:    Id<StructurePowerSpawn>;
    walls?:         Id<StructureWall>[];
    ramparts?:      Id<StructureRampart>[];
    keeperLairs?:   Id<StructureKeeperLair>[];
    invaderCores?:  Id<StructureInvaderCore>[];
    powerBanks?:    Id<StructurePowerBank>[];
    portals?:       Id<StructurePortal>[];
    lastAssigned?:  number;
  }

  // * GENERAL INTERFACES, NOT COMPLETELY IMPLEMENTED YET
  export interface Coord {
    x: number;
    y: number;
  }

  interface Pos {
    x: number
    y: number
  }

  interface Rect {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  interface Colors {
    white:      string
    lightGrey:  string
    lightBlue:  string
    darkBlue:   string
    black:      string
    yellow:     string
    red:        string
    green:      string
    brown:      string
  }
  interface PathGoal {
    pos:    RoomPosition;
    range:  number
  }

  interface PathOpts {
    origin:       RoomPosition
    goal:         PathGoal
    typeWeights?: { [key: string]: number }
    plainCost?:   number
    swampCost?:   number
    maxRooms?:    number
    flee?:        boolean
    creep?:       Creep

    weightStructures?: { [key: string]: number }

    /*
     * An object with keys of weights and values of structures / creeps / cSites to weight
     */
    weightGameObjects?: { [key: string]: (Structure | Creep | ConstructionSite)[] }

    /*
     * An object with keys of weights and values of positions
     */
    weightPositions?: { [key: string]: Pos[] }
    weightCostMatrixes?: CostMatrix[]
    avoidEnemyRanges?: boolean
    avoidStationaryPositions?: boolean
    /*
     * Weight my ramparts by this value
     */
    myRampartWeight?: number
  }
  interface FindClosestPosOfValueOpts {
    CM:                 CostMatrix,
    startPos:           Pos
    requiredValue:      number
    reduceIterations?:  number
    initialWeight?:     number
    adjacentToRoads?:   boolean
    roadCM?:            CostMatrix
  }

  interface MoveRequestOpts extends PathOpts {
    cacheAmount?: number
  }

  interface BuildObj {
    structureType: BuildableStructureConstant
    x: number
    y: number
  }

  interface SpawnRequestOpts {
    defaultParts:     BodyPartConstant[]
    extraParts:       BodyPartConstant[]
    partsMultiplier:  number
    minCost:          number
    priority:         number
    memoryAdditions:  Partial<CreepMemory>
    groupComparator?: string[]
    threshold?:       number
    minCreeps?:       number | undefined
    maxCreeps?:       number | undefined
    maxCostPerCreep?: number | undefined
  }

  interface ExtraOpts {
    memory: CreepMemory
    energyStructures: (
            StructureSpawn |
            StructureExtension)[]
    dryRun: boolean
  }

  interface SpawnRequest {
    body:       BodyPartConstant[]
    tier:       number
    cost:       number
    extraOpts:  ExtraOpts
  }

  interface Stats {

    bases: number
    credits: number
    energy: number // * The amount of energy in storages and terminals in owned rooms
    boosts: { [key: string]: MineralBoostConstant } // * An object of boosts representing the amount of each boost in storages and terminals in owned rooms
    cpuUsage:     number
    cpuLimit:     number
    cpuBucket:    number
    memoryUsage:  number
    memoryLimit:  number

    GCLPercent:   number
    totalGCL:     number
    GCLLevel:     number
    GPLPercent:   number
    totalGPL:     number
    GPLLevel:     number

    creeps:                     number // * The total number of creeps the bot owns
    powerCreepCount:            number
    energyHarvested:            number // * The total amount of energy harvested by the bot per tick
    mineralsHarvested:          number
    controlPoints:              number
    energySpentOnCreeps:        number
    energySpentOnConstruction:  number
    energySpentOnRepairing:     number
    energySpentOnBarricades:    number
  }
  interface OrganizedStructures {
    spawn:            StructureSpawn[]
    extension:        StructureExtension[]
    road:             StructureRoad[]
    constructedWall:  StructureWall[]
    rampart:          StructureRampart[]
    keeperLair:       StructureKeeperLair[]
    portal:           StructurePortal[]
    controller:       StructureController[]
    link:             StructureLink[]
    storage:          StructureStorage[]
    tower:            StructureTower[]
    observer:         StructureObserver[]
    powerBank:        StructurePowerBank[]
    powerSpawn:       StructurePowerSpawn[]
    extractor:        StructureExtractor[]
    lab:              StructureLab[]
    terminal:         StructureTerminal[]
    container:        StructureContainer[]
    nuker:            StructureNuker[]
    factory:          StructureFactory[]
    invaderCore:      StructureInvaderCore[]
  }

  namespace NodeJS {
    interface Global {
      [key: string | number]: any;
      logs: string;
      cSiteCount: number;
      killAllCreeps(): string;
      destroyAllCSites(types: StructureConstant[]): string;
      calcTickTime(): void;
      roomDefense(room: Room): void;
      calcPath(): Array<PathFinderPath | number>;
      visualRCProgress(controllerID: StructureController): void;
      GOBI(ID: Id<AnyCreep | AnyStructure | ConstructionSite | Resource | Tombstone>): AnyCreep | AnyStructure | ConstructionSite | Resource | Tombstone;
      MC(name: string, dir: DirectionConstant): CreepMoveReturnCode;
      createRoomFlag(room: string): string | null;
      validateRoomName(roomName: string): roomName is RoomName;
      entries<K extends string, V extends {}>(obj: Partial<Record<K, V>>): [K, V][];
      keys<K extends string>(obj: Record<K, unknown>): K[];
    }
  }
}

// PURPOSE define pre-configured creep bodypart arrays as key/value pairs in an object
const spawnVariants: {[key: string]: Array<BodyPartConstant>} = {
  'harvester150':    [ MOVE , WORK ],
  'harvester250':    [ MOVE , WORK , WORK ],
  'harvester350':    [ MOVE , WORK , WORK , WORK ],
  'harvester400':    [ MOVE , MOVE , WORK , WORK , WORK ],
  'harvester450':    [ MOVE , WORK , WORK , WORK , WORK ],
  'harvester550':    [ MOVE , WORK , WORK , WORK , WORK , WORK ],
  'harvester650':    [ MOVE , WORK , WORK , WORK , WORK , WORK , WORK ],
  'harvester800':    [ MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK , WORK ],
  'filler100':    [ CARRY, MOVE ],
  'filler300':    [ CARRY, CARRY, CARRY, MOVE , MOVE , MOVE ],
  'filler400':    [ CARRY, CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE ],
  'filler500':    [ CARRY, CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , MOVE ],
  'filler800':    [ CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE ],
  'filler1000':   [ CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , MOVE ],
  'upgrader300':     [ CARRY, MOVE , WORK , WORK ],
  'upgrader350':     [ CARRY, MOVE , MOVE , WORK , WORK ],
  'upgrader400':     [ CARRY, CARRY, MOVE , MOVE , WORK , WORK ],
  'upgrader500':     [ CARRY, MOVE , WORK , WORK , WORK , WORK ],
  'upgrader550':     [ CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , WORK , WORK ],
  'upgrader700':     [ CARRY, MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK ],
  'upgrader900':     [ CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK , WORK  ],
  'upgrader1000':    [ CARRY, CARRY, MOVE , MOVE , WORK , WORK , WORK , WORK , WORK , WORK , WORK ],
  'builder300':      [ CARRY, CARRY, MOVE , MOVE , WORK ],
  'builder350':      [ CARRY, CARRY, MOVE , MOVE , MOVE , WORK ],
  'builder400':      [ CARRY, CARRY, MOVE , MOVE , WORK , WORK ],
  'builder500':      [ CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , WORK , WORK ],
  'builder600':      [ CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , WORK , WORK , WORK ],
  'builder700':      [ CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , WORK , WORK , WORK ],
  'builder800':      [ CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK ],
  'builder1000':     [ CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK ],
  'builder1100':     [ CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK ],
  'builder1600':     [ CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK ],
  'repairer300':     [ CARRY, MOVE , WORK , WORK ],
  'repairer500':     [ CARRY, CARRY, MOVE , MOVE , WORK , WORK , WORK ],
  'repairer600':     [ CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , WORK , WORK , WORK ],
  'repairer800':     [ CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK] ,
  'repairer1000':    [ CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK , WORK ],
  'repairer1400':    [ CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK , WORK , WORK , WORK , WORK , WORK ],
  'runner300':       [ CARRY, CARRY, CARRY, CARRY, MOVE , MOVE ],
  'runner500':       [ CARRY, CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , MOVE ],
  'runner800':       [ CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE ],
  'crane300':        [ CARRY, CARRY, CARRY, CARRY, MOVE , MOVE ],
  'crane500':        [ CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE ],
  'crane800':        [ CARRY, CARRY, CARRY, CARRY, WORK , WORK , WORK , WORK , WORK , MOVE , MOVE ],
  'ranger1800':      [ MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK ],
  'warrior520':      [ TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE , MOVE , ATTACK, ATTACK, ATTACK, ATTACK ],
  'warrior1400':     [ TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK ],
  'warrior1800':     [ TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK ],
  'healer1200':      [ MOVE , MOVE , MOVE , MOVE , HEAL, HEAL, HEAL, HEAL ],
  'healer1800':      [ MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , HEAL, HEAL, HEAL, HEAL, HEAL, HEAL ],
  'beef1500':        [ TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE ],
  'remoteGuard700':  [ TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE , MOVE , MOVE , MOVE , MOVE , ATTACK, ATTACK, ATTACK, ATTACK ],
  'remoteLogi1200':  [ CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE ],
  'remoteLogi1500':  [ CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE ],
  'reserver650':     [ MOVE , CLAIM ],
  'reserver1300':    [ MOVE , MOVE , CLAIM, CLAIM ],
  'beast1800':       [ MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY ],
  'pony1250':        [ MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE , MOVE ]
}

// PURPOSE define working variant set for use in the main loop, assigned based on current energy capacity limits
let availableVariants:{[key: string]: {body: BodyPartConstant[], cost: number}} = {
  harvester:  { body: [], cost: 0},
  filler:  { body: [], cost: 0},
  upgrader:   { body: [], cost: 0},
  builder:    { body: [], cost: 0},
  repairer:   { body: [], cost: 0},
  runner:     { body: [], cost: 0},
  warrior:    { body: [], cost: 0},
  crane:      { body: [], cost: 0},
  remoteGuard:{ body: [], cost: 0},
  remoteLogi: { body: [], cost: 0},
  reserver:   { body: [], cost: 0},
  healer:     { body: [], cost: 0},
  ranger:     { body: [], cost: 0},
  beast:      { body: [], cost: 0},
  pony:       { body: [], cost: 0},
  beef:       { body: [], cost: 0}
}

// PURPOSE declare creep counting integers for spawning purposes
let builderCount:   number = 1;
let claimerCount:   number = 1;
let fillerCount: number = 1;
let craneCount:     number = 1;
let harvesterCount: number = 1;
let healerCount:    number = 1;
let invaderCount:   number = 1;
let minerCount:     number = 1;
let providerCount:  number = 1;
let rangerCount:    number = 1;
let rebooterCount:  number = 1;
let repairerCount:  number = 1;
let reserverCount:  number = 1;
let runnerCount:    number = 1;
let scientistCount: number = 1;
let scoutCount:     number = 1;
let upgraderCount:  number = 1;
let warriorCount:   number = 1;

let remoteBuilderCount:     number = 1;
let remoteGuardCount:       number = 1;
let remoteHarvesterCount:   number = 1;
let remoteLogisticianCount: number = 1;
let remoteRunnerCount:      number = 1;

// PURPOSE declare other global variables
let tickCount:            number  = 0;
let newName:              string  = '';
let spawnAnnounced:       boolean = false;
let harvesterDying:       boolean = false;
let runnerDying:          boolean = false;
let reserverDying:        boolean = false;
let fillerDying:       boolean = false;
let remoteHarvesterDying: boolean = false;
let remoteGuardDying:     boolean = false;
let minerDying:           boolean = false;

// PURPOSE initialize top level Memory objects if needed
if (Memory.miscData === undefined)
  Memory.miscData = {
  'containerCounter':     0,
  'outpostRoomCounter':   0,
  'outpostSourceCounter': 0,
  'outpostCounterRv':     0,
  'outpostCounterRG':     0,
  'rooms': {
    'W5N43': {}
    }
  };

if (Memory.globalSettings === undefined || Memory.globalSettings.creepSettings === undefined) {
  const globalSettings: GlobalSettings = {
    consoleSpawnInterval: 25,
    alertDisabled: true,
    reusePathValue: 5,
    ignoreCreeps: true,
    creepSettings: {
      builder: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      claimer: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      filler: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      crane: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      harvester: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      healer: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      invader: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      miner: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      provider: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      ranger: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      rebooter: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      remotebuilder: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      remoteguard: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      remoteharvester: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      remotelogistician: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      remoterunner: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      repairer: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      reserver: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      runner: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      scientist: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      scout: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      upgrader: {
        reusePathValue: 3,
        ignoreCreeps: true
      },
      warrior: {
        reusePathValue: 3,
        ignoreCreeps: true
      }
    }
  };
  Memory.globalSettings = globalSettings;
}

if (Memory.colonies === undefined) {
  const colonies: Colonies = { colonyList: [], registry: {} };
  Memory.colonies = colonies;
}

//*  When compiling TS to JS and bundling with rollup,
//*  the line numbers and file names in error messages change
//*  Use the ErrorMapper.wrapLoop() to sync the error changes.
//*  Use the regular version on the above line otherwise.
// ? NORMAL VERSION:
// ex> export const loop = function() {
// ? ERRORMAPPER VERSION:
export const loop = ErrorMapper.wrapLoop(() => {
  //: This is code to run in the main loop, just once each tick, separate from any room loops

  MemHack.pretick();

  if (typeof Memory.colonies === undefined) Memory.colonies = {};
  if (typeof Memory.colonies.colonyList === undefined) Memory.colonies.colonyList = [];
  if (Memory.globalSettings === undefined) {
    Memory.globalSettings = {};
    Memory.globalSettings.consoleSpawnInterval = 10;
  }

  calcTickTime();

  // PURPOSE Generate pixels with extra CPU time
  if (Game.shard.name === 'shard3') {
    if (Game.cpu.bucket == 10000) {
      Game.cpu.generatePixel()
      console.log('[GENERAL]: CPU Bucket at limit, generating pixel...');
    }
  }

  // PURPOSE Remove creeps from Memory after they die
  for (let name in Memory.creeps) {
    if (!Game.creeps[name]) {
      const role: CreepRoles = Memory.creeps[name].role;
      delete Memory.creeps[name];
      console.log('[GENERAL]: Clearing nonexistent creep memory: ', name);
      // reset naming counter for type of creep that died
      switch (role) {
        case 'builder':
          builderCount = 1;
          break;
        case 'claimer':
          claimerCount = 1;
          break;
        case 'filler':
          fillerCount = 1;
          break;
        case 'crane':
          craneCount = 1;
          break;
        case 'harvester':
          harvesterCount = 1;
          break;
        case 'healer':
          healerCount = 1;
          break;
        case 'invader':
          invaderCount = 1;
          break;
        case 'miner':
          minerCount = 1;
          break;
        case 'provider':
          providerCount = 1;
          break;
        case 'ranger':
          rangerCount = 1;
          break;
        case 'rebooter':
          rebooterCount = 1;
          break;
        case 'repairer':
          repairerCount = 1;
          break;
        case 'reserver':
          reserverCount = 1;
          break;
        case 'runner':
          runnerCount = 1;
          break;
        case 'scientist':
          scientistCount = 1;
          break;
        case 'scout':
          scoutCount = 1;
          break;
        case 'upgrader':
          upgraderCount = 1;
          break;
        case 'warrior':
          warriorCount = 1;
          break;
        case 'remotebuilder':
          remoteBuilderCount = 1;
          break;
        case 'remoteguard':
          remoteGuardCount = 1;
          break;
        case 'remoteharvester':
          remoteHarvesterCount = 1;
          break;
        case 'remotelogistician':
          remoteLogisticianCount = 1;
          break;
        case 'remoterunner':
          remoteRunnerCount = 1;
          break;
      }
    }
  }

  //: main code loop to run inside each room containing our units/structures
  _.forEach(Game.rooms, function (room: Room) {

    const rMem = room.memory;

    if (!rMem.objects) {
      console.log(room.link() + 'No room objects in memory. Caching.')
      room.cacheObjects();
    }

    if (!rMem.settings) {
      room.initSettings();
      room.initFlags();
    }

    if (Memory.miscData.rooms[room.name] === undefined)
      Memory.miscData.rooms[room.name] = {};

    const cSites: Array<ConstructionSite> = room.find(FIND_CONSTRUCTION_SITES, { filter: (i) => i.structureType !== STRUCTURE_ROAD})
    const numCSitesPrevious: number = rMem.data.numCSites || 0;
    rMem.data.numCSites = cSites.length;
    const numCSites: number = rMem.data.numCSites;

    if (numCSites < numCSitesPrevious) {
      room.cacheObjects();
      if (rMem.outpostOfRoom) {
        const outpostContainers: Id<StructureContainer>[] = rMem.objects.containers;
        const outpostAggregateContainerList: Id<StructureContainer>[] = Game.rooms[rMem.outpostOfRoom].memory.outposts.aggregateContainerList;

        const missingContainers: Id<StructureContainer>[] = outpostAggregateContainerList.filter(containerId => !outpostContainers.includes(containerId));
      }
    }

    _.forEach(cSites, function (cSite: ConstructionSite) {
      if (cSite.progress > 0) buildProgress(cSite, room);
    });

    //: FOR ROOMS OWNED BY BOT
    if (room && room.controller && room.controller.my) {

      const data:     RoomData     = rMem.data;
      const objects:  RoomObjects  = rMem.objects;
      const settings: RoomSettings = rMem.settings;
      const flags:    RoomFlags    = rMem.settings.flags;
      const colonies: Colonies     = Memory.colonies;

      if (tickCount > 0 && tickCount % 1000 == 0) {
        log('MAIN LOOP, CACHING OBJECTS EVERY 1000 TICKS --- Tick#: ' + tickCount, room);
        room.cacheObjects();
      }

      if (Memory.colonies.registry[room.name] === undefined) {
        Memory.colonies.registry[room.name] = {};
        let colonyListArray: string[] = Memory.colonies.colonyList || [];
        colonyListArray.push(room.name);
        Memory.colonies.colonyList = colonyListArray;
        Memory.colonies.registry[room.name].ID        = Memory.colonies.colonyList.length;
        Memory.colonies.registry[room.name].level     = room.controller.level;
        Memory.colonies.registry[room.name].spawns    = [];
        Memory.colonies.registry[room.name].exitDirs  = Object.keys(Game.map.describeExits(room.name));
        Memory.colonies.registry[room.name].exitRooms = Object.values(Game.map.describeExits(room.name));
        Memory.colonies.registry[room.name].outposts  = {};
      }

      if (room.controller.level !== Memory.colonies.registry[room.name].level)
        Memory.colonies.registry[room.name].level = room.controller.level;

      const roomSpawns:    StructureSpawn[] = room.find(FIND_MY_SPAWNS);
      let roomSpawnsNames: string[] = [];
      for (let i = 0; i < roomSpawns.length; i++)
        roomSpawnsNames.push(roomSpawns[i].name);
      if (Memory.colonies.registry[room.name].spawns.length < roomSpawnsNames.length)
        Memory.colonies.registry[room.name].spawns = roomSpawnsNames;

      if (!rMem.data.upgraderBucket) {
        const upgraderBucket: Array<StructureContainer | StructureStorage | StructureLink> = room.controller.pos.findInRange(FIND_STRUCTURES, 5, { filter: (i) => i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE || i.structureType == STRUCTURE_LINK });

        if (upgraderBucket.length > 0)
          rMem.data.upgraderBucket = upgraderBucket[0].id;
      }

      if (rMem.settings.visualSettings.displayControllerUpgradeRange) {
        room.visual.circle(room.controller.pos, {fill: '#002200', radius: 4, stroke: '#00aa00', strokeWidth: 0.1, opacity: 0.5, lineStyle: 'dashed'})
      }

      const roomName: string = room.name;

      if (!rMem.objects       ) room.cacheObjects();
      if (!rMem.settings      ) room.initSettings();
      if (!rMem.settings.flags) room.initFlags();
      if (!rMem.targets       ) room.initTargets();

      let spawn: StructureSpawn;
      if (rMem.objects.spawns && rMem.objects.spawns.length)
        spawn = Game.getObjectById(rMem.objects.spawns[0]);

      // PURPOSE tower logic function
      roomDefense(room);

      //: SPAWN VARIANT ALLOCATION
      if (room.energyCapacityAvailable === 300) {
        availableVariants.harvester.body      = spawnVariants.harvester250;
        availableVariants.harvester.cost      = 250;
        availableVariants.filler.body         = spawnVariants.filler100;
        availableVariants.filler.cost         = 100;
        availableVariants.upgrader.body       = spawnVariants.upgrader300;
        availableVariants.upgrader.cost       = 300;
        availableVariants.builder.body        = spawnVariants.builder300;
        availableVariants.builder.cost        = 300;
        availableVariants.repairer.body       = spawnVariants.repairer300;
        availableVariants.repairer.cost       = 300;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane300;
        availableVariants.crane.cost          = 300;
      } else if (room.energyCapacityAvailable <= 350) {
        availableVariants.harvester.body      = spawnVariants.harvester350;
        availableVariants.harvester.cost      = 350;
        availableVariants.filler.body         = spawnVariants.filler300;
        availableVariants.filler.cost         = 300;
        availableVariants.upgrader.body       = spawnVariants.upgrader350;
        availableVariants.upgrader.cost       = 350;
        availableVariants.builder.body        = spawnVariants.builder350;
        availableVariants.builder.cost        = 350;
        availableVariants.repairer.body       = spawnVariants.repairer300;
        availableVariants.repairer.cost       = 300;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane300;
        availableVariants.crane.cost          = 300;
      } else if (room.energyCapacityAvailable <= 400) {
        availableVariants.harvester.body      = spawnVariants.harvester400;
        availableVariants.harvester.cost      = 400;
        availableVariants.filler.body         = spawnVariants.filler300;
        availableVariants.filler.cost         = 300;
        availableVariants.upgrader.body       = spawnVariants.upgrader400;
        availableVariants.upgrader.cost       = 400;
        availableVariants.builder.body        = spawnVariants.builder350;
        availableVariants.builder.cost        = 350;
        availableVariants.repairer.body       = spawnVariants.repairer300;
        availableVariants.repairer.cost       = 300;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane300;
        availableVariants.crane.cost          = 300;
      } else if (room.energyCapacityAvailable <= 500) {
        availableVariants.harvester.body      = spawnVariants.harvester450;
        availableVariants.harvester.cost      = 450;
        availableVariants.filler.body         = spawnVariants.filler300;
        availableVariants.filler.cost         = 300;
        availableVariants.upgrader.body       = spawnVariants.upgrader400;
        availableVariants.upgrader.cost       = 400;
        availableVariants.builder.body        = spawnVariants.builder350;
        availableVariants.builder.cost        = 350;
        availableVariants.repairer.body       = spawnVariants.repairer300;
        availableVariants.repairer.cost       = 300;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane300;
        availableVariants.crane.cost          = 300;
      } else if (room.energyCapacityAvailable <= 550) {
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler300;
        availableVariants.filler.cost         = 300;
        availableVariants.upgrader.body       = spawnVariants.upgrader550;
        availableVariants.upgrader.cost       = 550;
        availableVariants.builder.body        = spawnVariants.builder500;
        availableVariants.builder.cost        = 500;
        availableVariants.repairer.body       = spawnVariants.repairer500;
        availableVariants.repairer.cost       = 500;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.warrior.body        = spawnVariants.warrior520;
        availableVariants.warrior.cost        = 520;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
      } else if (room.energyCapacityAvailable <= 600) {
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler300;
        availableVariants.filler.cost         = 300;
        availableVariants.upgrader.body       = spawnVariants.upgrader550;
        availableVariants.upgrader.cost       = 550;
        availableVariants.builder.body        = spawnVariants.builder500;
        availableVariants.builder.cost        = 500;
        availableVariants.repairer.body       = spawnVariants.repairer500;
        availableVariants.repairer.cost       = 500;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.warrior.body        = spawnVariants.warrior520;
        availableVariants.warrior.cost        = 520;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
      } else if (room.energyCapacityAvailable <= 700) {
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler500;
        availableVariants.filler.cost         = 500;
        availableVariants.upgrader.body       = spawnVariants.upgrader550;
        availableVariants.upgrader.cost       = 550;
        availableVariants.builder.body        = spawnVariants.builder600;
        availableVariants.builder.cost        = 600;
        availableVariants.repairer.body       = spawnVariants.repairer500;
        availableVariants.repairer.cost       = 500;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
      } else if (room.energyCapacityAvailable <= 800) {
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler500;
        availableVariants.filler.cost         = 500;
        availableVariants.upgrader.body       = spawnVariants.upgrader700;
        availableVariants.upgrader.cost       = 700;
        availableVariants.builder.body        = spawnVariants.builder600;
        availableVariants.builder.cost        = 600;
        availableVariants.repairer.body       = spawnVariants.repairer500;
        availableVariants.repairer.cost       = 500;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.reserver.body       = spawnVariants.reserver650;
        availableVariants.reserver.cost       = 650;
      } else if (room.energyCapacityAvailable <= 900) {
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler500;
        availableVariants.filler.cost         = 500;
        availableVariants.upgrader.body       = spawnVariants.upgrader800;
        availableVariants.upgrader.cost       = 800;
        availableVariants.builder.body        = spawnVariants.builder700;
        availableVariants.builder.cost        = 700;
        availableVariants.repairer.body       = spawnVariants.repairer600;
        availableVariants.repairer.cost       = 600;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.reserver.body       = spawnVariants.reserver650;
        availableVariants.reserver.cost       = 650;
      } else if (room.energyCapacityAvailable <= 1000) {
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler500;
        availableVariants.filler.cost         = 500;
        availableVariants.upgrader.body       = spawnVariants.upgrader700;
        availableVariants.upgrader.cost       = 700;
        availableVariants.builder.body        = spawnVariants.builder800;
        availableVariants.builder.cost        = 800;
        availableVariants.repairer.body       = spawnVariants.repairer800;
        availableVariants.repairer.cost       = 800;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.reserver.body       = spawnVariants.reserver650;
        availableVariants.reserver.cost       = 650;
      } else if (room.energyCapacityAvailable <= 1250) {
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler500;
        availableVariants.filler.cost         = 500;
        availableVariants.upgrader.body       = spawnVariants.upgrader700;
        availableVariants.upgrader.cost       = 700;
        availableVariants.builder.body        = spawnVariants.builder800;
        availableVariants.builder.cost        = 800;
        availableVariants.repairer.body       = spawnVariants.repairer800;
        availableVariants.repairer.cost       = 800;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.reserver.body       = spawnVariants.reserver650;
        availableVariants.reserver.cost       = 650;
      } else if (room.energyCapacityAvailable <= 1300) {
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler800;
        availableVariants.filler.cost         = 800;
        availableVariants.upgrader.body       = spawnVariants.upgrader700;
        availableVariants.upgrader.cost       = 700;
        availableVariants.builder.body        = spawnVariants.builder1000;
        availableVariants.builder.cost        = 1000;
        availableVariants.repairer.body       = spawnVariants.repairer1000;
        availableVariants.repairer.cost       = 1000;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.remoteLogi.body     = spawnVariants.remoteLogi1200;
        availableVariants.remoteLogi.cost     = 1200;
        availableVariants.reserver.body       = spawnVariants.reserver1300;
        availableVariants.reserver.cost       = 1300;
      } else if (room.energyCapacityAvailable <= 1600) {
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler800;
        availableVariants.filler.cost         = 800;
        availableVariants.upgrader.body       = spawnVariants.upgrader900;
        availableVariants.upgrader.cost       = 900;
        availableVariants.builder.body        = spawnVariants.builder1100;
        availableVariants.builder.cost        = 1100;
        availableVariants.repairer.body       = spawnVariants.repairer1000;
        availableVariants.repairer.cost       = 1000;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.warrior.body        = spawnVariants.warrior1400;
        availableVariants.warrior.cost        = 1400;
        availableVariants.healer.body         = spawnVariants.healer1200;
        availableVariants.healer.cost         = 1200;
        availableVariants.remoteLogi.body     = spawnVariants.remoteLogi1500;
        availableVariants.remoteLogi.cost     = 1500;
        availableVariants.reserver.body       = spawnVariants.reserver1300;
        availableVariants.reserver.cost       = 1300;
      } else if (room.energyCapacityAvailable <= 1800) {
        availableVariants.harvester.body      = spawnVariants.harvester550;
        availableVariants.harvester.cost      = 550;
        availableVariants.filler.body         = spawnVariants.filler800;
        availableVariants.filler.cost         = 800;
        availableVariants.upgrader.body       = spawnVariants.upgrader900;
        availableVariants.upgrader.cost       = 900;
        availableVariants.builder.body        = spawnVariants.builder1100;
        availableVariants.builder.cost        = 1100;
        availableVariants.repairer.body       = spawnVariants.repairer1000;
        availableVariants.repairer.cost       = 1000;
        availableVariants.runner.body         = spawnVariants.runner300;
        availableVariants.runner.cost         = 300;
        availableVariants.crane.body          = spawnVariants.crane500;
        availableVariants.crane.cost          = 500;
        availableVariants.remoteGuard.body    = spawnVariants.remoteGuard700;
        availableVariants.remoteGuard.cost    = 700;
        availableVariants.warrior.body        = spawnVariants.warrior1800;
        availableVariants.warrior.cost        = 1800;
        availableVariants.ranger.body         = spawnVariants.ranger1800;
        availableVariants.ranger.cost         = 1800;
        availableVariants.healer.body         = spawnVariants.healer1800;
        availableVariants.healer.cost         = 1800;
        availableVariants.remoteLogi.body     = spawnVariants.remoteLogi1500;
        availableVariants.remoteLogi.cost     = 1500;
        availableVariants.reserver.body       = spawnVariants.reserver1300;
        availableVariants.reserver.cost       = 1300;
      }

      //: PER-ROOM LINK MANAGEMENT LOGIC
      if (rMem.objects.links) {
        if (rMem.data.linkRegistry === undefined) room.registerLinks();

        const registeredLinks = Object.entries(rMem.data.linkRegistry);

        if (rMem.objects.links.length !== registeredLinks.length) {
          let counter: number = 0;
          if (rMem.data.linkRegistry.sourceOne      )  counter++;
          if (rMem.data.linkRegistry.central        )  counter++;
          if (rMem.data.linkRegistry.sourceTwo      )  counter++;
          if (rMem.data.linkRegistry.destination) counter++;
          if (rMem.data.linkRegistry.remotes) {
            for (let link in rMem.data.linkRegistry.remotes)
              counter++;
          }
          if (rMem.objects.links.length !== counter )  room.registerLinks();
        }

        let linkOne:      StructureLink;
        let linkTwo:      StructureLink;
        let linkCentral:  StructureLink;
        let linkDest:     StructureLink;
        let linkRem1:     StructureLink;


        if (rMem.data.linkRegistry.sourceOne  ) linkOne     = Game.getObjectById(rMem.data.linkRegistry.sourceOne   );
        if (rMem.data.linkRegistry.sourceTwo  ) linkTwo     = Game.getObjectById(rMem.data.linkRegistry.sourceTwo   );
        if (rMem.data.linkRegistry.destination) linkDest    = Game.getObjectById(rMem.data.linkRegistry.destination );
        if (rMem.data.linkRegistry.central    ) linkCentral = Game.getObjectById(rMem.data.linkRegistry.central     );
        if (rMem.data.linkRegistry.remotes[0] ) linkRem1    = Game.getObjectById(rMem.data.linkRegistry.remotes[ 0 ]);

        if (linkCentral && linkOne) {
          if ((linkOne.store.getFreeCapacity(RESOURCE_ENERGY) < 100) && linkOne.cooldown == 0 && (linkCentral.store.getFreeCapacity(RESOURCE_ENERGY) >= linkOne.store.getUsedCapacity(RESOURCE_ENERGY)))
            linkOne.transferEnergy(linkCentral);
        }
        if (linkCentral && linkTwo) {
          if ((linkTwo.store.getFreeCapacity(RESOURCE_ENERGY) < 100) && linkTwo.cooldown == 0 && (linkCentral.store.getFreeCapacity(RESOURCE_ENERGY) >= linkTwo.store.getUsedCapacity(RESOURCE_ENERGY)))
            linkTwo.transferEnergy(linkCentral);
        }
        if (linkCentral && linkDest) {
          if ((linkCentral.store[RESOURCE_ENERGY] > 99) && linkCentral.cooldown == 0 && linkDest.store[RESOURCE_ENERGY] < 401)
            linkCentral.transferEnergy(linkDest);
        }

        if (linkCentral && linkRem1) {
          if ((linkRem1.store.getUsedCapacity(RESOURCE_ENERGY) > 700) && linkRem1.cooldown == 0 && (linkCentral.store.getFreeCapacity(RESOURCE_ENERGY) >= linkRem1.store.getUsedCapacity(RESOURCE_ENERGY)))
            linkRem1.transferEnergy(linkCentral);
        }
      }

      //$ >#######################################################################################################################< $\\
      //$> ################################## SPAWNING QUOTA & CURRENT SPAWN COUNT DECLARATIONS ################################## <$\\
      //$ >#######################################################################################################################< $\\

      // pull creep role caps from room memory, or set to default value if none are set
      let harvesterTarget:  number = _.get(room.memory, ['targets', 'harvester'], 2);
      let fillerTarget:  number = _.get(room.memory, ['targets', 'filler'], 2);
      let upgraderTarget:   number = _.get(room.memory, ['targets', 'upgrader' ], 2);
      let builderTarget:    number = _.get(room.memory, ['targets', 'builder'  ], 2);
      let repairerTarget:   number = _.get(room.memory, ['targets', 'repairer' ], 1);
      let runnerTarget:     number = _.get(room.memory, ['targets', 'runner'   ], 3);
      let rebooterTarget:   number = _.get(room.memory, ['targets', 'rebooter' ], 0);
      let reserverTarget:   number = _.get(room.memory, ['targets', 'reserver' ], 0);
      let rangerTarget:     number = _.get(room.memory, ['targets', 'ranger'   ], 0);
      let warriorTarget:    number = _.get(room.memory, ['targets', 'warrior'  ], 0);
      let healerTarget:     number = _.get(room.memory, ['targets', 'healer'   ], 0);
      let craneTarget:      number = _.get(room.memory, ['targets', 'crane'    ], 0);
      let minerTarget:      number = _.get(room.memory, ['targets', 'miner'    ], 0);
      let scientistTarget:  number = _.get(room.memory, ['targets', 'scientist'], 0);
      let scoutTarget:      number = _.get(room.memory, ['targets', 'scout'    ], 0);


      let remoteHarvesterTarget:   number;
      if (rMem.outposts !== undefined && rMem.outposts.aggregateSourceList !== undefined) remoteHarvesterTarget = rMem.outposts.aggregateSourceList.length;
      else remoteHarvesterTarget          = _.get(room.memory, ['targets', 'remoteharvester'  ], 1);
      let remoteBuilderTarget:     number = _.get(room.memory, ['targets', 'remotebuilder'    ], 1);
      let remoteGuardTarget:       number = _.get(room.memory, ['targets', 'remoteguard'      ], 1);
      let remoteLogisticianTarget: number = _.get(room.memory, ['targets', 'remotelogistician'], 1);

      // pull current amount of creeps alive by roleForQuota
      let harvesters:         Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'harvester'         &&      creep.memory.homeRoom == roomName);
      let fillers:         Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'filler'         &&      creep.memory.homeRoom == roomName);
      let upgraders:          Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'upgrader'          &&      creep.memory.homeRoom == roomName);
      let builders:           Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'builder'           &&      creep.memory.homeRoom == roomName);
      let repairers:          Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'repairer'          &&      creep.memory.homeRoom == roomName);
      let runners:            Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'runner'            &&      creep.memory.homeRoom == roomName);
      let rebooters:          Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'rebooter'          &&      creep.memory.homeRoom == roomName);
      let reservers:          Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'reserver'          &&      creep.memory.homeRoom == roomName);
      let rangers:            Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'ranger'            &&      creep.memory.homeRoom == roomName);
      let warriors:           Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'warrior'           &&      creep.memory.homeRoom == roomName);
      let healers:            Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'healer'            &&      creep.memory.homeRoom == roomName);
      let cranes:             Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'crane'             &&      creep.memory.homeRoom == roomName);
      let miners:             Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'miner'             &&      creep.memory.homeRoom == roomName);
      let scientists:         Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'scientist'         &&      creep.memory.homeRoom == roomName);
      let scouts:             Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'scout'             &&      creep.memory.homeRoom == roomName);

      let remoteHarvesters:   Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remoteharvester'   &&      creep.memory.homeRoom == roomName);
      let remoteBuilders:     Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remotebuilder'     &&      creep.memory.homeRoom == roomName);
      let remoteGuards:       Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remoteguard'       &&      creep.memory.homeRoom == roomName);
      let remoteLogisticians: Creep[] = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remotelogistician' &&      creep.memory.homeRoom == roomName);

      let sites: Array<ConstructionSite> = room.find(FIND_CONSTRUCTION_SITES);
      let remoteSites: Array<ConstructionSite> = [];

      if (room.memory.outposts !== undefined) {
        for (let i = 0; i < room.memory.outposts.roomList.length; i++) {
          if (Game.rooms[room.memory.outposts.roomList[i]] !== undefined) {
            const outpostSites = Game.rooms[room.memory.outposts.roomList[i]].find(FIND_CONSTRUCTION_SITES);
            remoteSites = remoteSites.concat(outpostSites);
          }
        }
      }

      // Select a non-geriatric filler to loot compounds or energy from enemy corpses
      let invaderLooterAnnounced: boolean = false;
      if (invaderLooterAnnounced == false) {
        const hostiles: Array<Creep> = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length > 0) {
          const hostileOwner: string = hostiles[0].owner.username;
          const creepName:    string = hostiles[0].name;
          log(hostileOwner + ': -----------------HOSTILE CREEPS PRESENT----------------- ' + creepName, room);
          room.visual.rect(-1, -1, 51, 51, { fill: '#440000', stroke: '#ff0000', opacity: 0.2, strokeWidth: 0.2 });
          if (fillers.length) {
            for (let i = 0; i < fillers.length; i++) {
              if (fillers[i].ticksToLive > 300) {
                fillers[i].memory.invaderLooter = true;
                console.log('Creep \'' + fillers[i].name + '\' is now the invader looter.');
                invaderLooterAnnounced = true;
                break;
              } else
                continue;
            }
          }
        } else invaderLooterAnnounced = false;
      }

      let creepCount: number = 0;
      let capacity:   number;

      if (Memory.creeps) {
        creepCount = Object.keys(Memory.creeps).length;

        if (creepCount < 2)  capacity = room.energyAvailable;
        else  capacity = room.energyCapacityAvailable;
      }

      if (rMem.settings.flags.craneUpgrades == true) {
        availableVariants.crane.body        = spawnVariants.crane800;
        availableVariants.crane.cost        = 800;
      }

      if (room.storage) {
        if (room.energyAvailable <= 300 && room.storage.store[ RESOURCE_ENERGY ] <= 1000 && creepCount <= 1)
        availableVariants.harvester.body    = spawnVariants.harvester250;
        availableVariants.filler.body    = spawnVariants.filler300;
      }
      // * if we have no fillers, and our energy supply is not enough for a 500 energy spawn, do a 300.
      if (fillers.length == 0) {
        if (room.energyAvailable < 500)
          availableVariants.filler.body   = spawnVariants.filler300;
      }

      // ensure that two harvesters never use the same source for harvesting, when spawning 6-work harvesters
      // if it happens, send the older one to the opposite source
      if (harvesters.length >= 2 && harvesters[0].getActiveBodyparts(WORK) >= 5) {
        if (harvesters[0].memory.source == harvesters[1].memory.source) {
          if (harvesters[0].ticksToLive > harvesters[1].ticksToLive) {
            harvesters[1].assignHarvestSource(true);
            log('Reassigned ' + harvesters[1].name + '\'s source due to conflict.', room);
          }
          else {
            harvesters[0].assignHarvestSource(true);
            log('Reassigned ' + harvesters[0].name + '\'s source due to conflict.', room);
          }
        }
      }

      //$ >#######################################################################################################################< $\\
      //$> ################################## CREEP PRE-SPAWN LOGIC FOR HIGHLY IMPORTANT ROLES ################################### <$\\
      //$ >#######################################################################################################################< $\\

      for (let i = 0; i < harvesters.length; i++) {       // * Harvester Pre-Spawn
        harvesterDying = false;
        if (harvesters[i].ticksToLive <= 50) {
          harvesterDying = true;
          break;
        }
      }
      for (let i = 0; i < runners.length; i++) {          // * Runner Pre-Spawn
        runnerDying = false;
        if (runners[i].ticksToLive <= 20) {
          runnerDying = true;
          break;
        }
      }
      for (let i = 0; i < remoteHarvesters.length; i++) { // * Remote Harvester Pre-Spawn
        remoteHarvesterDying = false;
        if (remoteHarvesters[i].ticksToLive <= 110) {
          remoteHarvesterDying = true;
          break;
        }
      }
      for (let i = 0; i < fillers.length; i++) {       // * Filler Pre-Spawn
        fillerDying = false;
        if (fillers[i].ticksToLive <= 30) {
          fillerDying = true;
          break;
        }
      }
      for (let i = 0; i < remoteGuards.length; i++) {     // * Remote Guard Pre-Spawn
        remoteGuardDying = false;
        if (remoteGuards[i].ticksToLive <= 110) {
          remoteGuardDying = true;
          break;
        }
      }
      for (let i = 0; i < miners.length; i++) {           // * Miner Pre-Spawn
        minerDying = false;
        if (miners[i].ticksToLive <= 60) {
          minerDying = true;
          break;
        }
      }

      // $ >#####################################################################################################################< $ \\
      // $> ################################################ SPAWN MANAGEMENT SYSTEM ############################################ <$ \\
      // $ >#####################################################################################################################< $ \\

      const colIndex:   number         = Memory.colonies.colonyList.indexOf(room.name);
      const colonyNum:  number         = colIndex + 1;
      const colonyName: string         = 'Col' + colonyNum;

      const spawns: StructureSpawn[] = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN}});

      if (spawns.length) {
        let readySpawn: StructureSpawn = spawns[0];
        for (let i = 0; i < spawns.length; i++) {
          const thisSpawn: StructureSpawn = spawns[i];
          if (thisSpawn.spawning) continue;
          else readySpawn = thisSpawn;
        }
        if (!readySpawn.spawning) {
          const numCreeps: number = Object.keys(Game.creeps).length;
          if (numCreeps == 0 && room.energyAvailable <= 300 && (!room.storage || (room.storage &&  room.storage.store[RESOURCE_ENERGY] < 500)) && room.controller.level > 1) {
            newName = colonyName + '_Rb' + rebooterCount;
            while (readySpawn.spawnCreep([WORK, WORK, MOVE], newName, { memory: { role: 'rebooter', roleForQuota: 'rebooter', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
              rebooterCount++;
              newName = colonyName + '_Rb' + rebooterCount;
            }
            log('Spawning an emergency Rebooter...', room);
          } else if (numCreeps <= 1 && room.energyAvailable <= 300 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 500) {
            const result = readySpawn.spawnCreep([CARRY, MOVE], 'Collie the Emergency Filler Creep', { memory: { role: 'filler', roleForQuota: 'filler', homeRoom: roomName } });
            switch (result) {
              case OK:
                log('Spawning an emergency Filler...', room);
              case ERR_BUSY:
              case ERR_NOT_ENOUGH_ENERGY:
              case ERR_INVALID_ARGS:
              case ERR_RCL_NOT_ENOUGH:
                break;
              case ERR_NAME_EXISTS:
                readySpawn.spawnCreep([CARRY, MOVE], 'Collie the Emergency Filler Back-up Creep', { memory: { role: 'filler', roleForQuota: 'filler', homeRoom: roomName } });
                break;
            }
          } else {
            if ((harvesters.length < harvesterTarget) || (harvesters.length <= harvesterTarget && harvesterDying && harvesterTarget !== 0)) {
              newName = colonyName + '_H' + harvesterCount;
              while (readySpawn.spawnCreep(availableVariants.harvester.body, newName, { memory: { role: 'harvester', roleForQuota: 'harvester', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                harvesterCount++;
                newName = colonyName + '_H' + harvesterCount;
              }
            } else if ((fillers.length < fillerTarget) || (fillers.length <= fillerTarget && fillerDying && fillerTarget !== 0)) {
              newName = colonyName + '_F' + fillerCount;
              let max = 800;
              if (room.energyCapacityAvailable < 800) max = 500;
              while (readySpawn.spawnCreep(readySpawn.determineBodyparts('filler', max), newName, { memory: { role: 'filler', roleForQuota: 'filler', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                fillerCount++;
                newName = colonyName + '_F' + fillerCount;
              }
            } else {
              //$ REBOOTERS/FILLERS/HARVESTERS are at quota, move on to the rest:
              if ((runners.length < runnerTarget) || (runners.length <= runnerTarget && runnerDying && runnerTarget !== 0)) {
                newName = colonyName + '_Rn' + runnerCount;
                if (room.controller.level >= 4 && room.storage) {
                  while (readySpawn.spawnCreep(readySpawn.determineBodyparts('runner', room.energyCapacityAvailable), newName, { memory: { role: 'runner', roleForQuota: 'runner', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                    runnerCount++;
                    newName = colonyName + '_Rn' + runnerCount;
                  }
                } else {
                  while (readySpawn.spawnCreep(availableVariants.runner.body, newName, { memory: { role: 'runner', roleForQuota: 'runner', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                    runnerCount++;
                    newName = colonyName + '_Rn' + runnerCount;
                  }
                }
              } else if (room.storage && cranes.length < craneTarget) {
                newName = colonyName + '_Cn' + craneCount;
                while (readySpawn.spawnCreep(availableVariants.crane.body, newName, { memory: { role: 'crane', roleForQuota: 'crane', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  craneCount++;
                  newName = colonyName + '_Cn' + craneCount;
                }
              } else if ((reservers.length < reserverTarget) || (reservers.length <= reserverTarget && reserverDying && reserverTarget !== 0)) {
                newName = colonyName + '_Rv' + reserverCount;
                while (readySpawn.spawnCreep(availableVariants.reserver.body, newName, { memory: { role: 'reserver', roleForQuota: 'reserver', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  reserverCount++;
                  newName = colonyName + '_Rv' + reserverCount;
                }
              } else if ((remoteHarvesters.length < remoteHarvesterTarget) || (remoteHarvesters.length <= remoteHarvesterTarget && remoteHarvesterDying && remoteHarvesterTarget !== 0)) {
                newName = colonyName + '_RH' + remoteHarvesterCount;
                while (readySpawn.spawnCreep([CARRY, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK], newName, { memory: { role: 'remoteharvester', roleForQuota: 'remoteharvester', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  remoteHarvesterCount++;
                  newName = colonyName + '_RH' + remoteHarvesterCount;
                }
              } else if (sites.length > 0 && builders.length < builderTarget) {
                newName = colonyName + '_B' + builderCount;
                while (readySpawn.spawnCreep(availableVariants.builder.body, newName, { memory: { role: 'builder', roleForQuota: 'builder', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  builderCount++;
                  newName = colonyName + '_B' + builderCount;
                }
              } else if (upgraders.length < upgraderTarget) {
                newName = colonyName + '_U' + upgraderCount;
                while (readySpawn.spawnCreep(availableVariants.upgrader.body, newName, { memory: { role: 'upgrader', roleForQuota: 'upgrader', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  upgraderCount++;
                  newName = colonyName + '_U' + upgraderCount;
                }
              } else if (repairers.length < repairerTarget) {
                newName = colonyName + '_Rp' + repairerCount;
                while (readySpawn.spawnCreep(availableVariants.repairer.body, newName, { memory: { role: 'repairer', roleForQuota: 'repairer', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  repairerCount++;
                  newName = colonyName + '_Rp' + repairerCount
                }
              } else if (miners.length < minerTarget && rMem.objects.extractor) {
                newName = colonyName + '_M' + minerCount;
                while (readySpawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName, { memory: { role: 'miner', roleForQuota: 'miner', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  minerCount++;
                  newName = colonyName + '_M' + minerCount;
                }
              } else if (scientists.length < scientistTarget && rMem.objects.labs) {
                newName = colonyName + '_S' + scientistCount;
                while (readySpawn.spawnCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY], newName, { memory: { role: 'scientist', roleForQuota: 'scientist', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  scientistCount++;
                  newName = colonyName + '_S' + scientistCount;
                }
              } else if (remoteSites.length > 0 && remoteBuilders.length < remoteBuilderTarget) {
                newName = colonyName + '_RB' + remoteBuilderCount;
                while (readySpawn.spawnCreep(availableVariants.builder.body, newName, { memory: { role: 'remotebuilder', roleForQuota: 'remotebuilder', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  remoteBuilderCount++;
                  newName = colonyName + '_RB' + remoteBuilderCount;
                }
              } else if ((remoteGuards.length < remoteGuardTarget) || (remoteGuards.length <= remoteGuardTarget && remoteGuardDying && remoteGuardTarget !== 0)) {
                newName = colonyName + '_RG' + remoteGuardCount;
                while (readySpawn.spawnCreep(availableVariants.remoteGuard.body, newName, { memory: { role: 'remoteguard', roleForQuota: 'remoteguard', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  remoteGuardCount++;
                  newName = colonyName + '_RG' + remoteGuardCount;
                }
              } else if (remoteLogisticians.length < remoteLogisticianTarget) {
                newName = colonyName + '_RL' + remoteLogisticianCount;
                while (readySpawn.spawnCreep(availableVariants.remoteLogi.body, newName, { memory: { role: 'remotelogistician', roleForQuota: 'remotelogistician', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                  remoteLogisticianCount++;
                  newName = colonyName + '_RL' + remoteLogisticianCount;
                }
              } else {
                //$ RESERVERS/REMOTE RUNNERS/HARVESTERS/BUILDERS/GUARDS are at quota, move on to defensive creeps:
                if (rangers.length < rangerTarget) {
                  newName = colonyName + '_Rng' + rangerCount;
                  while (readySpawn.spawnCreep(availableVariants.ranger.body, newName, { memory: { role: 'ranger', roleForQuota: 'ranger', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                    rangerCount++;
                    newName = colonyName + '_Rng' + rangerCount;
                  }
                } else if (warriors.length < warriorTarget) {
                  newName = colonyName + '_War' + warriorCount;
                  while (readySpawn.spawnCreep(availableVariants.warrior.body, newName, { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                    warriorCount++;
                    newName = colonyName + '_War' + warriorCount;
                  }
                } else if (healers.length < healerTarget) {
                  newName = colonyName + '_Hlr' + healerCount;
                  while (readySpawn.spawnCreep(availableVariants.healer.body, newName, { memory: { role: 'healer', roleForQuota: 'healer', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                    healerCount++;
                    newName = colonyName + '_Hlr' + healerCount;
                  }
                } else if (scouts.length < scoutTarget) {
                  newName = colonyName + '_Sct' + scoutCount;
                  while (readySpawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE], newName, { memory: { role: 'scout', roleForQuota: 'scout', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                    scoutCount++;
                    newName = colonyName + '_Sct' + scoutCount;
                  }
                }
              }
            }
          }
        }

        if (rMem.data.claimRooms !== undefined) {
        const rooms = Object.keys(rMem.data.claimRooms) as RoomName[];

          for (let i = 0; i < rooms.length; i++) {
            if (rMem.data.claimRooms[rooms[i]].hasBeenClaimed === false && rMem.data.claimRooms[rooms[i]].claimerSpawned === false && !readySpawn.spawning) {
              const creeps = Object.entries(Memory.creeps);
              const claimers = creeps.filter((creep) => creep[1].memory.role === 'claimer');
              console.log(claimers);
              const claimerSpawned = readySpawn.spawnClaimer(rMem.data.claimRooms[rooms[i]].roomName, 'Claimer' + i + 1, true);
              if (claimerSpawned === 'OK')
                rMem.data.claimRooms[rooms[i]].claimerSpawned = true;
            } else if (rMem.data.claimRooms[rooms[i]].neededHarvesters > 0 && !readySpawn.spawning) {
              const harvesterSpawned = readySpawn.spawnNewClaimHarvester(rMem.data.claimRooms[rooms[i]].roomName, 'NewClaimHarvester' + i);
              if (harvesterSpawned === 'OK')
                  rMem.data.claimRooms[rooms[i]].neededHarvesters -= 1;
            } else if (rMem.data.claimRooms[rooms[i]].neededBuilders > 0 && !readySpawn.spawning) {
              const builderSpawned = readySpawn.spawnNewClaimBuilder(rMem.data.claimRooms[rooms[i]].roomName, 'NewClaimBuilder' + i);
              if (builderSpawned === 'OK')
                rMem.data.claimRooms[rooms[i]].neededBuilders -= 1;
            } else if (rMem.data.claimRooms[rooms[i]].energyRemaining > 0) {
              const haulerSpawned = readySpawn.spawnNewClaimHauler(rMem.data.claimRooms[rooms[i]].roomName, 'NewClaimHauler');
            }
          }
        }

        //* Displays Energy Available / Energy Capacity above Spawn Location
        room.visual.text('Energy: ' + room.energyAvailable
          + '/' + room.energyCapacityAvailable,
          readySpawn.pos.x,
          readySpawn.pos.y - 1,
          { align: 'center', opacity: 0.8, color: '#00dddd', stroke: '#000000', font: 0.4 }
        );

      } //! END OF PRIMARY SPAWNING LOGIC

      //$ >#######################################################################################################################< $\\
      //#region ######################################### ROOM VISUALS DISPLAY IMPLEMENTATION #################################### <$\\
      //$ >#######################################################################################################################< $\\

      //: PER SPAWN CREEP SPAWNING INFORMATION
      if (spawns.length) {
        for (let i = 0; i < spawns.length; i++) {
          if (spawns[i].spawning) {

            let spawningCreep = Game.creeps[spawns[i].spawning.name];
            if (Memory.miscData.rooms[room.name].spawnAnnounced) {
              console.log(spawns[i].room.link() + ': Spawning new creep: ' + spawningCreep.memory.role + ' (' + spawningCreep.name + ')');
              Memory.miscData.rooms[room.name].spawnAnnounced = true;
            }
            spawns[i].room.visual.text(spawningCreep.memory.role + ' - ' + spawns[i].spawning.remainingTime + '/' + spawns[i].spawning.needTime, spawns[i].pos.x, spawns[i].pos.y + 1.25, { stroke: '#111111', color: '#ff00ff', align: 'center', opacity: 0.8, font: 0.4 });
          } else
            Memory.miscData.rooms[room.name].spawnAnnounced = false;
        }


      //: CONSOLE-BASED CREEP CENSUS VS TARGETS & ENERGY CAPACITY

        const tickInterval: number = Memory.globalSettings.consoleSpawnInterval;
        let storageInfo = '';
        if (room.storage) storageInfo = '<' + room.storage.store[ RESOURCE_ENERGY ].toString() + '> ';
        const energy  :  string = 'NRG: ' + room.energyAvailable + '/' + room.energyCapacityAvailable + '(' + (room.energyAvailable / room.energyCapacityAvailable * 100).toFixed(0) + '%) ';
        const hInfo   :  string = (harvesterTarget)       ? '| H:'   + harvesters.length       + '(' + harvesterTarget       + ') ' : '';
        const fInfo   :  string = (fillerTarget)       ? '| C:'   + fillers.length       + '(' + fillerTarget       + ') ' : '';
        const rInfo   :  string = (runnerTarget)          ? '| Rn:'  + runners.length          + '(' + runnerTarget          + ') ' : '';
        const bInfo   :  string = (builderTarget)         ? '| B:'   + builders.length         + '(' + builderTarget         + ') ' : '';
        const uInfo   :  string = (upgraderTarget)        ? '| U:'   + upgraders.length        + '(' + upgraderTarget        + ') ' : '';
        const rpInfo  :  string = (repairerTarget)        ? '| Rp:'  + repairers.length        + '(' + repairerTarget        + ') ' : '';
        const cnInfo  :  string = (craneTarget)           ? '| Cn:'  + cranes.length           + '(' + craneTarget           + ') ' : '';
        const rtInfo  :  string = (rebooterTarget)        ? '| Rb:'  + rebooters.length        + '(' + rebooterTarget        + ') ' : '';
        const rvInfo  :  string = (reserverTarget)        ? '| Rv:'  + reservers.length        + '(' + reserverTarget        + ') ' : '';
        const rngInfo :  string = (rangerTarget)          ? '| Rng:' + rangers.length          + '(' + rangerTarget          + ') ' : '';
        const warInfo :  string = (warriorTarget)         ? '| War:' + warriors.length         + '(' + warriorTarget         + ') ' : '';
        const hlrInfo :  string = (healerTarget)          ? '| Hlr:' + healers.length          + '(' + healerTarget          + ') ' : '';
        const rhInfo  :  string = (remoteHarvesterTarget) ? '| RH:'  + remoteHarvesters.length + '(' + remoteHarvesterTarget + ') ' : '';
        const rbInfo  :  string = (remoteBuilderTarget)   ? '| RB:'  + remoteBuilders.length   + '(' + remoteBuilderTarget   + ') ' : '';
        const rgInfo  :  string = (remoteGuardTarget)     ? '| RG:'  + remoteGuards.length     + '(' + remoteGuardTarget     + ')'  : '';

        if (tickInterval !== 0 && tickCount % tickInterval === 0) {
          console.log(room.link() + energy + storageInfo + hInfo + fInfo + rInfo + bInfo + uInfo + rpInfo + cnInfo + rtInfo + rvInfo + rngInfo + warInfo + hlrInfo + rhInfo + rbInfo + rgInfo + ' Tick: ' + tickCount);
        }

        //: ROOM VISUALS - SPAWN INFO BOXES
        const rmFlgs: RoomFlags      = rMem.settings.flags;
        const rmVis : VisualSettings = rMem.settings.visualSettings;

        if (rmVis === undefined || rmVis.spawnInfo === undefined) room.initSettings();
        const alignment : alignment = rmVis.spawnInfo.alignment;
        const spawnColor: string    = rmVis.spawnInfo.color;
        const spawnFont : number    = rmVis.spawnInfo.fontSize || 0.5;
        let spawnX      : number    = 49;
        if (alignment == 'left') spawnX = 0;

        //* BOTTOM RIGHT BOX
        room.visual.rect(
          41.75, 44.5, 7.5, 4.75,
          { fill: '#555555',
          stroke: '#aaaaaa',
          opacity: 0.3,
          strokeWidth: 0.2
        });
        // Harvesters, Fillers, Upgraders, Builders, Cranes
        room.visual.text(
              'H:'  + harvesters.length + '(' + harvesterTarget +
          ') | C:'  + fillers.length + '(' + fillerTarget +
          ') | U:'  + upgraders.length  + '(' + upgraderTarget  +
          ') | B:'  + builders.length   + '(' + builderTarget   +
          ') | Cn:' + cranes.length     + '(' + craneTarget     + ')',
          spawnX, 49,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Remote Harvesters, Remote Runners, Remote Builders, Remote Guards
        room.visual.text(
              'RH:' + remoteHarvesters.length + '(' + remoteHarvesterTarget +
          ') | RB:' + remoteBuilders.length   + '(' + remoteBuilderTarget   +
          ') | RG:' + remoteGuards.length     + '(' + remoteGuardTarget     + ')',
          spawnX, 48,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Runners, Repaireres, Rebooters, Reservers
        room.visual.text(
              'Rn:' + runners.length   + '(' + runnerTarget   +
          ') | Rp:' + repairers.length + '(' + repairerTarget +
          ') | Rb:' + rebooters.length + '(' + rebooterTarget +
          ') | Rv:' + reservers.length + '(' + reserverTarget + ')',
          spawnX, 47,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Rangers, Warriors, Healers
        room.visual.text(
              'Rng:' + rangers.length   + '(' + rangerTarget  +
          ') | War:' + warriors.length  + '(' + warriorTarget +
          ') | Hlr:' + healers.length   + '(' + healerTarget  + ')',
          spawnX, 46,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Energy Available, Energy Capacity
        room.visual.text(
          'Energy: ' + room.energyAvailable + '('
            + room.energyCapacityAvailable + ')',
          spawnX, 45,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });

        //* TOP RIGHT BOX
        room.visual.rect(
          41.75, 0, 7.5, 4.75,
          { fill: '#555555',
            stroke: '#aaaaaa',
            opacity: 0.3,
            strokeWidth: 0.2
          });
        // Harvesters, Fillers, Upgraders, Builders, Cranes
        room.visual.text(
              'H:'  + harvesters.length + '(' + harvesterTarget +
          ') | C:'  + fillers.length + '(' + fillerTarget +
          ') | U:'  + upgraders.length  + '(' + upgraderTarget  +
          ') | B:'  + builders.length   + '(' + builderTarget   +
          ') | Cn:' + cranes.length     + '(' + craneTarget     + ')',
          spawnX, 0.5,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Remote Harvesters, Remote Runners, Remote Builders, Remote Guards
        room.visual.text(
              'RH:' + remoteHarvesters.length + '(' + remoteHarvesterTarget +
          ') | RB:' + remoteBuilders.length   + '(' + remoteBuilderTarget   +
          ') | RG:' + remoteGuards.length     + '(' + remoteGuardTarget     + ')',
          spawnX, 1.5,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Runners, Repairers, Rebooters, Reservers
        room.visual.text(
              'Rn:' + runners.length   + '(' + runnerTarget   +
          ') | Rp:' + repairers.length + '(' + repairerTarget +
          ') | Rb:' + rebooters.length + '(' + rebooterTarget +
          ') | Rv:' + reservers.length + '(' + reserverTarget + ')',
          spawnX, 2.5,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Rangers, Warriors, Healers
        room.visual.text(
              'Rng:' + rangers.length   + '(' + rangerTarget  +
          ') | War:' + warriors.length  + '(' + warriorTarget +
          ') | Hlr:' + healers.length   + '(' + healerTarget  + ')',
          spawnX, 3.5,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });
        // Energy Available, Energy Capacity
        room.visual.text(
          'Energy: ' + room.energyAvailable + '('
          + room.energyCapacityAvailable + ')',
          spawnX, 4.5,
          { align: alignment,
            color: spawnColor,
            font: spawnFont
          });

        //: ROOM VISUALS - ROOM FLAG SETTINGS BOX

        const xCoord:       number = rmVis.roomFlags.displayCoords[0];
        const yCoord:       number = rmVis.roomFlags.displayCoords[1];
        const fontSize:     number = rmVis.roomFlags.fontSize || 0.4;
        const displayColor: string = rmVis.roomFlags.color;

        //* OUTER RECTANGLE
        room.visual.rect(
          xCoord - 0.15,
          yCoord - 1.2,
          13, 1.35,
          { fill: '#770000',
            stroke: '#aa0000',
            opacity: 0.3,
            strokeWidth: 0.1
          });

        //* TOP ROW FLAGS
        room.visual.text(
            'CSL('    + rmFlgs.centralStorageLogic   +
          ')  SCS('    + rmFlgs.sortConSites          +
          ')  CCS('    + rmFlgs.closestConSites       +
          ')  CU('     + rmFlgs.craneUpgrades         +
          ')   HFA('   + rmFlgs.harvestersFixAdjacent +
          ')     RDM(' + rmFlgs.runnersDoMinerals     + ')',
          xCoord, (yCoord - 0.6),
          { align: 'left',
            font: fontSize,
            color: displayColor
          });
        //* BOTTOM ROW FLAGS
        room.visual.text(
            'RDP('  + rmFlgs.runnersDoPiles      +
          ')   RB('  + rmFlgs.repairBasics        +
          ')   RR('  + rmFlgs.repairRamparts      +
          ')    RW(' + rmFlgs.repairWalls         +
          ')   TRB(' + rmFlgs.towerRepairBasic    +
          ')   TRD(' + rmFlgs.towerRepairDefenses + ')',
          xCoord, yCoord - 0.1,
          { align: 'left',
            font: fontSize,
            color: displayColor
          });
      }

      //: ROOM CONTROLLER UPGRADE PROGRESS
      if (room.controller.level >= 1) visualRCProgress(room.controller);

      //: DISPLAY ENERGY ABOVE ROOM STORAGE
      if (room.storage)
        room.visual.text(
          ' Storage: ' + room.storage.store[RESOURCE_ENERGY],
          room.storage.pos.x,
          room.storage.pos.y - 1,
          { align: 'center',
            opacity: 0.8,
            font: 0.4,
            stroke:
            '#000000',
            color: '#ffff00'
          });

      //: TOWER DAMAGE BOX DISPLAYS
      if (room.memory.settings.visualSettings.displayTowerRanges) {
        _.forEach(room.memory.objects.towers, function (towerID) {
          const tower = Game.getObjectById(towerID);
          tower.room.visual.rect(-0.5, -0.5, 51, 51, { fill: '#550000', opacity: 0.25, stroke: '#880000' });
          tower.room.visual.rect(tower.pos.x - 19.5, tower.pos.y - 19.5, 39, 39, { fill: '#aa3e00', opacity: 0.15, stroke: '#ff8800' });
          tower.room.visual.rect(tower.pos.x - 15.5, tower.pos.y - 15.5, 31, 31, { fill: '#aaaa00', opacity: 0.2, stroke: '#ffff00' });
          tower.room.visual.rect(tower.pos.x - 10.5, tower.pos.y - 10.5, 21, 21, { fill: '#003300', opacity: 0.2, stroke: '#008800' });
          tower.room.visual.rect(tower.pos.x - 5.5, tower.pos.y - 5.5, 11, 11, { fill: '#4476ff', opacity: 0.25, stroke: '#00e1ff' });


        })
      }

      // #endregion *******************************************************************************************************************

     // ! END OF (ROOMS CLAIMED BY BOT)
    }
  }); // ! END OF (FOR EACH ROOM BOT HAS VISIBILITY)

  //$ >##########################################################################################################################< $\\
  //$> ############################################# ROLE EXECUTION SWITCH CASE ################################################# <$\\
  //$ >##########################################################################################################################< $\\

  for(let name in Game.creeps) {
    const creep = Game.creeps[name];

    switch (creep.memory.role) {

      //* LOCAL COLONY ROLES
      case 'harvester':
        roleHarvester .run(creep);
        break;
      case 'filler':
        roleFiller .run(creep);
        break;
      case 'runner':
        roleRunner    .run(creep);
        break;
      case 'builder':
        roleBuilder   .run(creep);
        break;
      case 'filler':
        roleFiller    .run(creep);
        break;
      case 'upgrader':
        roleUpgrader  .run(creep);
        break;
      case 'repairer':
        roleRepairer  .run(creep);
        break;
      case 'crane':
        roleCrane     .run(creep);
        break;
      case 'miner':
        roleMiner     .run(creep);
        break;
      case 'scientist':
        roleScientist .run(creep);
        break;

      //* REMOTE/OUTPOST ROLES
      case 'remotelogistician':
        roleRemoteLogistician .run(creep);
        break;
      case 'remoteharvester':
        roleRemoteHarvester   .run(creep);
        break;
      case 'remotebuilder':
        roleRemoteBuilder     .run(creep);
        break;
      case 'remoteguard':
        roleRemoteGuard       .run(creep);
        break;

      //* SPECIAL USE ROLES
      case 'reserver':
        roleReserver.run(creep);
        break;
      case 'rebooter':
        roleRebooter.run(creep);
        break;
      case 'claimer':
        roleClaimer .run(creep);
        break;
      case 'provider':
        roleProvider.run(creep);
        break;
      case 'scout':
        roleScout   .run(creep);
        break;

      //* COMBAT ROLES
      case 'ranger':
        roleRanger  .run(creep);
        break;
      case 'warrior':
        roleWarrior .run(creep);
        break;
      case 'healer':
        roleHealer  .run(creep);
        break;
      case 'invader':
        roleInvader .run(creep);
        break;
    }
  }
  //$ >########################################## END OF ROLE EXECUTION SWITCH CASE ##############################################< $\\
  tickCount++;
}); // ! END OF MAIN LOOP


