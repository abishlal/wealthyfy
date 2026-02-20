import csv
import io
from typing import List, Any, Dict


class ExportService:
    @staticmethod
    def to_csv(data: List[Any], fields: List[str]) -> str:
        """
        Convert a list of objects (or dicts) to a CSV string.
        """
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=fields)
        writer.writeheader()

        for item in data:
            if hasattr(item, "__dict__"):
                # Handle SQLAlchemy models or Pydantic schemas
                # Convert to dict, filtering for requested fields
                row = {}
                for field in fields:
                    if "." in field:
                        parts = field.split(".")
                        val = item
                        for part in parts:
                            val = getattr(val, part, None)
                            if val is None:
                                break
                    else:
                        val = getattr(item, field, "")

                    if val is None:
                        val = ""
                    row[field] = val
                writer.writerow(row)
            elif isinstance(item, dict):
                row = {field: item.get(field, "") for field in fields}
                writer.writerow(row)

        return output.getvalue()
