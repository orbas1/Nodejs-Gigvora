import 'package:equatable/equatable.dart';

class GigPackage extends Equatable {
  const GigPackage({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.deliveryDays,
    required this.deliverables,
    this.popular = false,
    this.mediaPreview,
  });

  factory GigPackage.fromJson(Map<String, dynamic> json) {
    return GigPackage(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Package',
      description: json['description'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      deliveryDays: json['deliveryDays'] as int? ?? 7,
      deliverables: (json['deliverables'] as List<dynamic>? ?? const <dynamic>[])
          .map((value) => value.toString())
          .toList(growable: false),
      popular: json['popular'] as bool? ?? false,
      mediaPreview: json['mediaPreview'] as String?,
    );
  }

  final String id;
  final String name;
  final String description;
  final double price;
  final int deliveryDays;
  final List<String> deliverables;
  final bool popular;
  final String? mediaPreview;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'deliveryDays': deliveryDays,
      'deliverables': deliverables,
      'popular': popular,
      'mediaPreview': mediaPreview,
    };
  }

  GigPackage copyWith({
    String? id,
    String? name,
    String? description,
    double? price,
    int? deliveryDays,
    List<String>? deliverables,
    bool? popular,
    String? mediaPreview,
  }) {
    return GigPackage(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      price: price ?? this.price,
      deliveryDays: deliveryDays ?? this.deliveryDays,
      deliverables: deliverables ?? this.deliverables,
      popular: popular ?? this.popular,
      mediaPreview: mediaPreview ?? this.mediaPreview,
    );
  }

  @override
  List<Object?> get props => [id, name, description, price, deliveryDays, deliverables, popular, mediaPreview];
}
