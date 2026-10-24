// Copyright (c) 2026 InkSpace contributors. MIT License.
// Adapted from PDFExtension/PDFExtensionModel.swift in the complete application.
import Foundation

/// v1 interchange: displayed (rotated CropBox) page coordinates. Every stroke
/// coordinate and width is measured in original page-width units, not block-height.
public struct PDFExtensionStroke: Codable, Equatable, Identifiable, Sendable {
    public init(id: String = UUID().uuidString.lowercased(), color: String, width: Double, points: [[Double]], nativeInk: PDFNativeInkArchive? = nil) { self.id = id; self.color = color; self.width = width; self.points = points; self.nativeInk = nativeInk }

    public var id: String; public var color: String; public var width: Double; public var points: [[Double]]
    public var nativeInk: PDFNativeInkArchive? = nil
}
public struct PDFExtensionImage: Codable, Equatable, Identifiable, Sendable {
    public init(id: String = UUID().uuidString.lowercased(), resource: String, sha256: String, x: Double, y: Double, width: Double, height: Double) { self.id = id; self.resource = resource; self.sha256 = sha256; self.x = x; self.y = y; self.width = width; self.height = height }

    public var id: String; public var resource: String; public var sha256: String
    public var x: Double; public var y: Double; public var width: Double; public var height: Double
}
public struct PDFExtensionBlock: Codable, Equatable, Identifiable, Sendable {
    public init(id: String, page: Int, anchorX: Double, anchorY: Double, height: Double, mode: Mode, orderKey: String, title: String, text: String, strokes: [PDFExtensionStroke] = [], images: [PDFExtensionImage] = []) { self.id = id; self.page = page; self.anchorX = anchorX; self.anchorY = anchorY; self.height = height; self.mode = mode; self.orderKey = orderKey; self.title = title; self.text = text; self.strokes = strokes; self.images = images }

    public enum Mode: String, Codable, CaseIterable, Sendable { case inline, margin, collapsed }
    public var id: String; public var page: Int; public var anchorX: Double; public var anchorY: Double
    public var height: Double; public var mode: Mode; public var orderKey: String; public var title: String; public var text: String
    public var strokes: [PDFExtensionStroke]; public var images: [PDFExtensionImage]
    public static func make(page: Int, anchorX: Double = 0.5, anchorY: Double) -> Self {
        let id = UUID().uuidString.lowercased()
        return .init(id: id, page: page, anchorX: anchorX, anchorY: anchorY, height: 0.35, mode: .inline, orderKey: id, title: "", text: "", strokes: [], images: [])
    }
    /// Resolve a placement without turning a stale move into a new blank area.
    /// A move only applies while its original block still belongs to this page.
    public static func placement(page: Int, anchorY: Double, movingID: String?, blocks: [Self]) -> Self? {
        if let movingID {
            guard let block = blocks.first(where: { $0.id == movingID && $0.page == page }) else { return nil }
            return block.moved(to: anchorY)
        }
        return make(page: page, anchorY: anchorY)
    }
    public var minimumContentHeight: Double {
        max(0.12, (strokes.flatMap { stroke in stroke.points.compactMap { $0.count == 2 ? $0[1] + stroke.width/2 : nil } }.max() ?? 0) + 0.025,
            images.map { $0.y + $0.height }.max() ?? 0)
    }
    /// Resize changes only the available paper. Content stays in page-width
    /// coordinates, and reducing the paper must never clip ink or images.
    public func resized(to proposedHeight: Double, textMinimum: Double = 0.12) -> Self {
        guard proposedHeight.isFinite, textMinimum.isFinite else { return self }
        var copy = self
        let minimum = min(8, max(minimumContentHeight, textMinimum))
        copy.height = min(8, max(minimum, proposedHeight))
        return copy
    }
    public func moved(to anchor: Double) -> Self {
        guard anchor.isFinite else { return self }
        var copy = self; copy.anchorY = min(1, max(0, anchor)); return copy
    }
}
public struct PDFExtensionEvent: Codable, Equatable, Identifiable, Sendable {
    public init(schemaVersion: Int = 1, id: String, deviceID: String, createdAt: String, kind: Kind, targetID: String, sourceSHA256: String, baseEventID: String?, block: PDFExtensionBlock?) { self.schemaVersion = schemaVersion; self.id = id; self.deviceID = deviceID; self.createdAt = createdAt; self.kind = kind; self.targetID = targetID; self.sourceSHA256 = sourceSHA256; self.baseEventID = baseEventID; self.block = block }

    public static let maximumBytes = 1024 * 1024
    public enum Kind: String, Codable, Sendable { case upsert, delete }
    public var schemaVersion = 1
    public var id: String; public var deviceID: String; public var createdAt: String; public var kind: Kind
    public var targetID: String; public var sourceSHA256: String; public var baseEventID: String?; public var block: PDFExtensionBlock?
    public enum CodingKeys: String, CodingKey { case schemaVersion,id,deviceID,createdAt,kind,targetID,sourceSHA256,baseEventID,block }
    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(schemaVersion,forKey:.schemaVersion);try c.encode(id,forKey:.id);try c.encode(deviceID,forKey:.deviceID)
        try c.encode(createdAt,forKey:.createdAt);try c.encode(kind,forKey:.kind);try c.encode(targetID,forKey:.targetID)
        try c.encode(sourceSHA256,forKey:.sourceSHA256);try c.encode(baseEventID,forKey:.baseEventID);try c.encode(block,forKey:.block)
    }
    public var instant: Date { Self.date(createdAt) ?? .distantPast }
    public static func date(_ string: String) -> Date? {PDFWorkspaceEvent.parseDate(string)}
    public static func make(_ block: PDFExtensionBlock?, target: String, source: String, base: String?, device: String) -> Self {
        let f=ISO8601DateFormatter();f.formatOptions=[.withInternetDateTime,.withFractionalSeconds]
        return .init(id:UUID().uuidString.lowercased(),deviceID:device,createdAt:f.string(from:Date()),kind:block == nil ? .delete : .upsert,targetID:target,sourceSHA256:source,baseEventID:base,block:block)
    }
    public func encoded() throws -> Data { let e=JSONEncoder();e.outputFormatting=[.sortedKeys,.withoutEscapingSlashes];return try e.encode(self) }
    public static func hashValid(_ s:String) -> Bool { s.count == 64 && s.allSatisfy { "0123456789abcdef".contains($0) } }
    public static func decodeValidated(_ bytes: Data) throws -> Self {
        guard bytes.count <= maximumBytes else { throw PDFWorkspaceError.tooLarge }
        guard let raw=try JSONSerialization.jsonObject(with:bytes) as? [String:Any],
              Set(raw.keys)==Set(["schemaVersion","id","deviceID","createdAt","kind","targetID","sourceSHA256","baseEventID","block"]) else{throw PDFWorkspaceError.invalidRecord}
        if let block=raw["block"] as? [String:Any] {
            guard Set(block.keys)==Set(["id","page","anchorX","anchorY","height","mode","orderKey","title","text","strokes","images"]) else{throw PDFWorkspaceError.invalidRecord}
            for stroke in block["strokes"] as? [[String:Any]] ?? [] {
                let base=Set(["id","color","width","points"])
                guard Set(stroke.keys)==base || (Set(stroke.keys)==base.union(["nativeInk"]) && PDFNativeInkArchive.hasValidKeys(stroke["nativeInk"])) else{throw PDFWorkspaceError.invalidRecord}
            }
            for image in block["images"] as? [[String:Any]] ?? [] {guard Set(image.keys)==Set(["id","resource","sha256","x","y","width","height"]) else{throw PDFWorkspaceError.invalidRecord}}
        }
        let e=try JSONDecoder().decode(Self.self,from:bytes)
        func uuid(_ s:String)->Bool { UUID(uuidString:s) != nil && s == s.lowercased() }
        func finite(_ value:Double,_ low:Double,_ high:Double)->Bool { value.isFinite && value >= low && value <= high }
        guard e.schemaVersion==1,uuid(e.id),uuid(e.targetID),e.baseEventID == nil || uuid(e.baseEventID!),e.baseEventID != e.id,
              !e.deviceID.isEmpty,e.deviceID.utf8.count<=128,Self.date(e.createdAt) != nil,hashValid(e.sourceSHA256) else { throw PDFWorkspaceError.invalidRecord }
        if e.kind == .delete { guard e.block == nil else { throw PDFWorkspaceError.invalidRecord };return e }
        guard let b=e.block,b.id==e.targetID,b.page>0,b.page<=100000,finite(b.anchorX,0,1),finite(b.anchorY,0,1),finite(b.height,0.12,8),
              !b.orderKey.isEmpty,b.orderKey.utf8.count<=256,b.title.utf8.count<=8000,b.text.utf8.count<=256*1024,b.strokes.count<=500,b.images.count<=16,
              Set(b.strokes.map(\.id)).count==b.strokes.count,Set(b.images.map(\.id)).count==b.images.count else { throw PDFWorkspaceError.invalidRecord }
        var points=0
        for s in b.strokes {
            points+=s.points.count
            guard uuid(s.id),s.color.range(of:"^#[0-9A-Fa-f]{6}$",options:.regularExpression) != nil,finite(s.width,0.0001,0.08),!s.points.isEmpty,points<=100000,
                  s.points.allSatisfy({ $0.count==2 && finite($0[0],0,1) && finite($0[1],0,b.height) }),
                  s.nativeInk == nil || s.nativeInk!.isValid else { throw PDFWorkspaceError.invalidRecord }
        }
        for image in b.images {
            guard uuid(image.id),hashValid(image.sha256),image.resource == "assets/"+image.sha256+".png" || image.resource == "assets/"+image.sha256+".jpg",
                  finite(image.x,0,1),finite(image.y,0,b.height),finite(image.width,0.001,1),finite(image.height,0.001,8),image.x+image.width<=1.000001,image.y+image.height<=b.height+0.000001 else { throw PDFWorkspaceError.invalidRecord }
        }
        return e
    }
}
public struct PDFExtensionProjection: Sendable {
    public init(heads: [PDFExtensionEvent], warnings: [String]) { self.heads = heads; self.warnings = warnings }

    public var heads: [PDFExtensionEvent]
    public var warnings: [String]
    public static func project(_ events:[PDFExtensionEvent],warnings:[String]=[]) -> Self {
        var byID:[String:PDFExtensionEvent]=[:],ambiguous=Set<String>(),notices=warnings
        for event in events {if let old=byID[event.id],old != event {ambiguous.insert(event.id)}else{byID[event.id]=event}}
        for id in ambiguous {byID.removeValue(forKey:id)}
        if !ambiguous.isEmpty {notices.append(String(localized:"有重复标识的冲突留白记录，原始文件已保留，不自动覆盖。"))}
        var cyclic=Set<String>(),visited=Set<String>(),missing=false
        for event in byID.values where !visited.contains(event.id) {
            var positions:[String:Int]=[:],trail:[String]=[],cursor:PDFExtensionEvent?=event
            while let current=cursor {
                if let position=positions[current.id] {cyclic.formUnion(trail[position...]);break}
                if visited.contains(current.id){break}
                positions[current.id]=trail.count;trail.append(current.id)
                guard let base=current.baseEventID else{break}
                guard let parent=byID[base],parent.targetID==current.targetID,parent.sourceSHA256==current.sourceSHA256 else{missing=true;break}
                cursor=parent
            };visited.formUnion(trail)
        }
        if missing{notices.append(String(localized:"部分留白历史尚未同步完整，现有内容已保留。"))}
        if !cyclic.isEmpty{notices.append(String(localized:"留白历史存在循环引用，相关版本已保留，请查看历史。"))}
        let replaced=Set(byID.values.compactMap {event -> String? in
            guard let base=event.baseEventID,let prior=byID[base],prior.targetID==event.targetID,prior.sourceSHA256==event.sourceSHA256,!cyclic.contains(base),!cyclic.contains(event.id) else{return nil};return base
        })
        let formatter=ISO8601DateFormatter();formatter.formatOptions=[.withInternetDateTime,.withFractionalSeconds]
        let plain=ISO8601DateFormatter()
        let times=byID.mapValues{formatter.date(from:$0.createdAt) ?? plain.date(from:$0.createdAt) ?? .distantPast}
        let heads=byID.values.filter{!replaced.contains($0.id)}.sorted {a,b in times[a.id]==times[b.id] ? a.id<b.id:times[a.id]!<times[b.id]!}
        return .init(heads:heads,warnings:Array(Set(notices)).sorted())
    }
    public func current(source:String) -> [PDFExtensionEvent] {
        Dictionary(grouping:heads.filter{$0.sourceSHA256==source},by:\.targetID).values.compactMap { values in
            // A concurrent edit never silently resurrects an explicitly deleted block.
            values.last(where:{$0.kind == .delete}) ?? values.last
        }.sorted { a,b in
            guard let x=a.block,let y=b.block else{return a.id<b.id}
            return x.page != y.page ? x.page<y.page : x.anchorY != y.anchorY ? x.anchorY<y.anchorY : x.orderKey != y.orderKey ? x.orderKey<y.orderKey : x.id<y.id
        }
    }
    public var conflictCount:Int { Dictionary(grouping:heads,by:{$0.sourceSHA256+":"+$0.targetID}).values.filter{$0.count>1}.count }
}
